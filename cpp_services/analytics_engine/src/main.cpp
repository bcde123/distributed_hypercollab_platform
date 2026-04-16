/**
 * HyperCollab C++ Analytics Engine
 *
 * Consumes task lifecycle events from the Kafka `task-events` topic,
 * computes workspace-level metrics in real time, and persists them into
 * Redis where the Node.js API layer reads them for the dashboard.
 *
 * Improvements over v1:
 *   - Environment-variable configuration (KAFKA_BROKERS, REDIS_HOST, REDIS_PORT)
 *   - Redis command pipelining (batch multiple writes per message into 1 RTT)
 *   - Health heartbeat key so the dashboard can show engine liveness
 *   - Per-event-type counters for richer analytics
 *   - Structured console logging with ISO-8601 timestamps
 *   - Redis auto-reconnect on transient connection loss
 */

#include <iostream>
#include <string>
#include <chrono>
#include <csignal>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <sstream>
#include <iomanip>
#include <atomic>
#include <librdkafka/rdkafka.h>
#include <hiredis/hiredis.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;
using Clock = std::chrono::system_clock;

// ── Globals ───────────────────────────────────────────────────────────────────
static redisContext*     g_redis   = nullptr;
static rd_kafka_t*       g_rk      = nullptr;
static std::atomic<bool> g_running{true};

// Config (populated from env vars in main())
static std::string g_redis_host;
static int         g_redis_port;

// In-memory counters for the heartbeat
static std::atomic<uint64_t> g_events_processed{0};
static std::atomic<uint64_t> g_events_errors{0};

// ── Structured logging ────────────────────────────────────────────────────────
static std::string now_iso() {
    auto now = Clock::now();
    auto t   = Clock::to_time_t(now);
    auto ms  = std::chrono::duration_cast<std::chrono::milliseconds>(
                   now.time_since_epoch()) .count() % 1000;
    std::tm buf{};
    localtime_r(&t, &buf);
    std::ostringstream oss;
    oss << std::put_time(&buf, "%Y-%m-%dT%H:%M:%S")
        << '.' << std::setfill('0') << std::setw(3) << ms;
    return oss.str();
}

#define LOG_INFO(msg)  std::cout << "[" << now_iso() << "] [INFO]  " << msg << "\n"
#define LOG_WARN(msg)  std::cerr << "[" << now_iso() << "] [WARN]  " << msg << "\n"
#define LOG_ERROR(msg) std::cerr << "[" << now_iso() << "] [ERROR] " << msg << "\n"

// ── Signal handler ────────────────────────────────────────────────────────────
static void signal_handler(int sig) {
    LOG_INFO("Signal " << sig << " received — initiating shutdown");
    g_running.store(false);
}

// ── Env helper ────────────────────────────────────────────────────────────────
static std::string env(const char* key, const std::string& fallback) {
    const char* val = std::getenv(key);
    return (val && val[0]) ? std::string(val) : fallback;
}

// ── Redis init / reconnect ────────────────────────────────────────────────────
static bool connect_redis() {
    if (g_redis) { redisFree(g_redis); g_redis = nullptr; }

    struct timeval timeout = {2, 0}; // 2 s connect timeout
    g_redis = redisConnectWithTimeout(g_redis_host.c_str(), g_redis_port, timeout);

    if (!g_redis || g_redis->err) {
        if (g_redis) {
            LOG_ERROR("Redis connect failed: " << g_redis->errstr);
            redisFree(g_redis);
            g_redis = nullptr;
        } else {
            LOG_ERROR("Cannot allocate Redis context");
        }
        return false;
    }
    LOG_INFO("Connected to Redis @ " << g_redis_host << ":" << g_redis_port);
    return true;
}

// Ensure connection is alive; reconnect once if stale
static bool ensure_redis() {
    if (g_redis && g_redis->err == 0) return true;
    LOG_WARN("Redis connection lost — attempting reconnect");
    return connect_redis();
}

// ── Timestamp → YYYY-MM-DD ───────────────────────────────────────────────────
static std::string ts_to_date(long long ms) {
    if (ms <= 0) return "1970-01-01";
    std::time_t t = static_cast<std::time_t>(ms / 1000);
    std::tm buf{};
    localtime_r(&t, &buf);
    std::ostringstream oss;
    oss << std::put_time(&buf, "%Y-%m-%d");
    return oss.str();
}

// ── Pipelined Redis helper ────────────────────────────────────────────────────
// Appends a command to the pipeline; returns false on fatal connection error.
static bool pipeline_cmd(const char* fmt, ...) {
    if (!g_redis) return false;
    va_list ap;
    va_start(ap, fmt);
    int rc = redisvAppendCommand(g_redis, fmt, ap);
    va_end(ap);
    return (rc == REDIS_OK);
}

// Flushes `n` pending pipeline replies. Logs and frees each.
static void pipeline_flush(int n) {
    if (!g_redis) return;
    for (int i = 0; i < n; ++i) {
        redisReply* r = nullptr;
        if (redisGetReply(g_redis, reinterpret_cast<void**>(&r)) != REDIS_OK) {
            LOG_WARN("Pipeline reply " << i << " failed: " << g_redis->errstr);
            break;
        }
        if (r) freeReplyObject(r);
    }
}

// ── Health heartbeat ──────────────────────────────────────────────────────────
static void write_heartbeat() {
    if (!ensure_redis()) return;

    json hb;
    hb["status"]           = "running";
    hb["uptime_events"]    = g_events_processed.load();
    hb["errors"]           = g_events_errors.load();
    hb["last_heartbeat"]   = now_iso();

    std::string val = hb.dump();
    // SET with 60 s TTL — if engine dies, key expires and dashboard shows "offline"
    redisReply* r = static_cast<redisReply*>(
        redisCommand(g_redis, "SETEX analytics:engine:health 60 %s", val.c_str()));
    if (r) freeReplyObject(r);
}

// ── Message processor ─────────────────────────────────────────────────────────
static void process_message(rd_kafka_message_t* msg) {
    if (msg->err) {
        if (msg->err != RD_KAFKA_RESP_ERR__PARTITION_EOF)
            LOG_WARN("Consume error: " << rd_kafka_message_errstr(msg));
        return;
    }

    std::string_view raw(static_cast<const char*>(msg->payload), msg->len);
    LOG_INFO("⇐ " << raw);

    if (!ensure_redis()) {
        g_events_errors.fetch_add(1);
        return;
    }

    try {
        json j = json::parse(raw);
        std::string eventType   = j.value("eventType", "");
        std::string workspaceId = j.value("workspaceId", "");
        if (eventType.empty() || workspaceId.empty()) return;

        const std::string prefix = "analytics:workspace:" + workspaceId;

        long long ts = j.value("timestamp", 0LL);
        if (ts <= 0)
            ts = std::chrono::duration_cast<std::chrono::milliseconds>(
                     Clock::now().time_since_epoch()).count();
        std::string dateStr = ts_to_date(ts);

        // Pipeline counter: how many commands we'll batch
        int cmds = 0;

        // ── Per-event-type counter (always) ─────────────────────────────────
        // e.g. analytics:workspace:xxx:event_count:task_created
        std::string k_evt = prefix + ":event_count:" + eventType;
        pipeline_cmd("INCR %s", k_evt.c_str()); ++cmds;

        // ── General daily activity events ───────────────────────────────────
        std::string k_act = prefix + ":activity_events:" + dateStr;
        pipeline_cmd("INCR %s", k_act.c_str()); ++cmds;

        if (eventType == "task_completed") {
            long long completedAt = j.value("completedAt", 0LL);
            long long createdAt   = j.value("createdAt",   0LL);
            std::string compDate  = ts_to_date(completedAt);

            // 1. Total completed
            pipeline_cmd("INCR %s", (prefix + ":total_completed").c_str()); ++cmds;

            // 2. Cumulative duration
            if (createdAt > 0 && completedAt >= createdAt) {
                long long dur = completedAt - createdAt;
                pipeline_cmd("INCRBY %s %lld",
                    (prefix + ":total_duration_ms").c_str(), dur); ++cmds;
            }

            // 3. Per-user completion hash
            if (j.contains("assignees") && j["assignees"].is_array()) {
                std::string k_users = prefix + ":user_completed";
                for (auto& uid_val : j["assignees"]) {
                    std::string uid = uid_val.get<std::string>();
                    pipeline_cmd("HINCRBY %s %s 1", k_users.c_str(), uid.c_str()); ++cmds;
                }
            }

            // 4. Daily completions
            pipeline_cmd("INCR %s",
                (prefix + ":daily:" + compDate).c_str()); ++cmds;

        } else if (eventType == "task_created") {
            // Track total created for the "total tasks" stat
            pipeline_cmd("INCR %s", (prefix + ":total_created").c_str()); ++cmds;
        }

        // Flush the entire pipeline in one round-trip
        pipeline_flush(cmds);
        g_events_processed.fetch_add(1);

    } catch (const json::exception& e) {
        LOG_ERROR("JSON parse error: " << e.what());
        g_events_errors.fetch_add(1);
    }
}

// ── main ─────────────────────────────────────────────────────────────────────
int main() {
    LOG_INFO("HyperCollab C++ Analytics Engine v2.0 starting");

    std::signal(SIGINT,  signal_handler);
    std::signal(SIGTERM, signal_handler);

    // ── Configurable via env vars ─────────────────────────────────────────────
    g_redis_host = env("REDIS_HOST", "127.0.0.1");
    g_redis_port = std::stoi(env("REDIS_PORT", "6379"));
    std::string brokers = env("KAFKA_BROKERS", "localhost:9092");
    std::string topic   = env("KAFKA_TOPIC",   "task-events");
    std::string groupid = env("KAFKA_GROUP_ID", "analytics-engine-group");

    LOG_INFO("Config: kafka=" << brokers << " topic=" << topic
             << " redis=" << g_redis_host << ":" << g_redis_port);

    connect_redis(); // non-fatal if Redis is down initially

    // ── Kafka config ──────────────────────────────────────────────────────────
    char errstr[512];
    rd_kafka_conf_t* conf = rd_kafka_conf_new();

    auto set_conf = [&](const char* key, const std::string& val) -> bool {
        if (rd_kafka_conf_set(conf, key, val.c_str(), errstr, sizeof(errstr))
                != RD_KAFKA_CONF_OK) {
            LOG_ERROR("Kafka conf [" << key << "]: " << errstr);
            rd_kafka_conf_destroy(conf);
            return false;
        }
        return true;
    };

    if (!set_conf("bootstrap.servers", brokers))  return 1;
    if (!set_conf("group.id",          groupid))  return 1;
    if (!set_conf("auto.offset.reset", "earliest")) return 1;
    if (!set_conf("enable.auto.commit","true"))    return 1;

    g_rk = rd_kafka_new(RD_KAFKA_CONSUMER, conf, errstr, sizeof(errstr));
    if (!g_rk) {
        LOG_ERROR("Failed to create Kafka consumer: " << errstr);
        rd_kafka_conf_destroy(conf);
        return 1;
    }

    rd_kafka_poll_set_consumer(g_rk);

    rd_kafka_topic_partition_list_t* topics = rd_kafka_topic_partition_list_new(1);
    rd_kafka_topic_partition_list_add(topics, topic.c_str(), RD_KAFKA_PARTITION_UA);
    rd_kafka_resp_err_t err = rd_kafka_subscribe(g_rk, topics);
    rd_kafka_topic_partition_list_destroy(topics);

    if (err) {
        LOG_ERROR("Subscribe failed: " << rd_kafka_err2str(err));
        rd_kafka_destroy(g_rk);
        return 1;
    }

    LOG_INFO("Subscribed to [" << topic << "]. Polling...");

    // ── Poll loop with periodic heartbeat ─────────────────────────────────────
    auto last_heartbeat = Clock::now();
    const auto heartbeat_interval = std::chrono::seconds(15);

    while (g_running.load()) {
        rd_kafka_message_t* msg = rd_kafka_consumer_poll(g_rk, 500);
        if (msg) {
            process_message(msg);
            rd_kafka_message_destroy(msg);
        }

        // Periodic health heartbeat
        auto now = Clock::now();
        if (now - last_heartbeat >= heartbeat_interval) {
            write_heartbeat();
            last_heartbeat = now;
        }
    }

    // ── Shutdown ──────────────────────────────────────────────────────────────
    LOG_INFO("Closing Kafka consumer...");
    rd_kafka_consumer_close(g_rk);
    rd_kafka_destroy(g_rk);

    // Write final "stopped" heartbeat
    if (ensure_redis()) {
        redisReply* r = static_cast<redisReply*>(
            redisCommand(g_redis, "SETEX analytics:engine:health 300 %s",
                         R"({"status":"stopped"})"));
        if (r) freeReplyObject(r);
        redisFree(g_redis);
        g_redis = nullptr;
    }

    LOG_INFO("Analytics Engine shut down cleanly (processed "
             << g_events_processed.load() << " events, "
             << g_events_errors.load() << " errors)");
    return 0;
}
