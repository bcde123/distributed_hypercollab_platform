# HyperCollab C++ Analytics Engine v2.0

High-performance event consumer that processes task lifecycle events from Kafka,
computes workspace analytics in real time, and persists metrics to Redis.

## Architecture

```
┌──────────────┐   Kafka    ┌────────────────────┐   Redis    ┌───────────┐
│ Node.js API  │ ────────→  │  C++ Analytics     │ ────────→  │  Redis    │
│ (producer)   │ task-events │  Engine (consumer)  │ pipelined  │  Server   │
└──────────────┘            └────────────────────┘            └─────┬─────┘
                                                                    │
                                                              ┌─────▼─────┐
                                                              │ Node.js   │
                                                              │ REST API  │
                                                              │ /analytics│
                                                              └───────────┘
```

## Features

- **Redis Pipelining** — batches all writes per message into a single round-trip
- **Health Heartbeat** — writes a SETEX key every 15s with 60s TTL; dashboard shows live engine status
- **Auto-Reconnect** — recovers from transient Redis disconnections
- **Env Var Config** — no hardcoded connection strings
- **Structured Logging** — ISO-8601 timestamps, severity levels
- **Graceful Shutdown** — SIGINT/SIGTERM handlers, final "stopped" heartbeat

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `KAFKA_BROKERS` | `localhost:9092` | Kafka bootstrap servers |
| `KAFKA_TOPIC` | `task-events` | Topic to consume |
| `KAFKA_GROUP_ID` | `analytics-engine-group` | Consumer group ID |
| `REDIS_HOST` | `127.0.0.1` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |

## Dependencies

| Library | Purpose |
|---|---|
| `librdkafka` | Apache Kafka consumer (C API) |
| `hiredis` | Redis client (C API) |
| `nlohmann/json` | JSON parsing (header-only, vendored in `include/`) |

### macOS
```bash
brew install librdkafka hiredis
```

### Ubuntu / Debian
```bash
sudo apt-get install -y librdkafka-dev libhiredis-dev
```

## Build & Run

```bash
cd cpp_services/analytics_engine
mkdir -p build && cd build
cmake ..
make -j$(nproc)

# Run with custom config
KAFKA_BROKERS=kafka:9092 REDIS_HOST=redis ./analytics_engine
```

## Redis Keys Written

| Key | Type | Description |
|---|---|---|
| `analytics:workspace:{id}:total_completed` | String | Running count of completed tasks |
| `analytics:workspace:{id}:total_created` | String | Running count of created tasks |
| `analytics:workspace:{id}:total_duration_ms` | String | Sum of completion durations (ms) |
| `analytics:workspace:{id}:user_completed` | Hash | `{userId → count}` per assignee |
| `analytics:workspace:{id}:daily:{YYYY-MM-DD}` | String | Completions per day |
| `analytics:workspace:{id}:activity_events:{YYYY-MM-DD}` | String | All events per day |
| `analytics:workspace:{id}:event_count:{type}` | String | Count per event type |
| `analytics:engine:health` | String (TTL 60s) | JSON heartbeat with status, uptime, errors |
