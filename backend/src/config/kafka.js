/**
 * Kafka Configuration
 *
 * Initialises the KafkaJS client, producer, and admin.
 * The producer is connected lazily (call connectProducer() once at startup).
 * The admin client creates required topics if they don't exist.
 *
 * Topics managed by HyperCollab:
 *   task-events         – produced by Node.js, consumed by C++ analytics engine
 *   analytics-results   – produced by C++ engine, consumed by Node.js (read-back)
 */

const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'hypercollab-backend',
  brokers: (process.env.KAFKA_BROKER || 'localhost:9092').split(','),
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
  connectionTimeout: 3000,
  requestTimeout: 25000,
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
});

const admin = kafka.admin();

// ── Topic bootstrapping ──────────────────────────────────────────────────
const REQUIRED_TOPICS = [
  { topic: 'task-events',       numPartitions: 3, replicationFactor: 1 },
  { topic: 'analytics-results', numPartitions: 1, replicationFactor: 1 },
];

/**
 * Ensure all required topics exist. Safe to call multiple times
 * (createTopics with validateOnly=false is idempotent on existing topics).
 */
async function ensureTopics() {
  try {
    await admin.connect();
    await admin.createTopics({ topics: REQUIRED_TOPICS, waitForLeaders: true });
    console.log('✅ Kafka topics verified');
  } catch (err) {
    // Topic-exists errors are non-fatal
    if (err.type === 'TOPIC_ALREADY_EXISTS') {
      console.log('✅ Kafka topics already exist');
    } else {
      console.warn('⚠️  Kafka topic bootstrap warning:', err.message);
    }
  } finally {
    await admin.disconnect().catch(() => {});
  }
}

/**
 * Connect the producer and bootstrap topics.
 * Returns a resolved promise even if Kafka is unreachable so the
 * server still starts (event emission will fail gracefully at send-time).
 */
async function connectProducer() {
  try {
    await producer.connect();
    console.log('✅ Kafka producer connected');
    await ensureTopics();
  } catch (err) {
    console.error('⚠️  Kafka producer connection failed (server will continue):', err.message);
  }
}

/**
 * Graceful disconnect — call from SIGINT / SIGTERM handler.
 */
async function disconnectKafka() {
  try {
    await producer.disconnect();
    console.log('Kafka producer disconnected');
  } catch { /* swallow */ }
}

module.exports = { kafka, producer, connectProducer, disconnectKafka };
