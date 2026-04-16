/**
 * Kafka Event Emitter
 *
 * Fire-and-forget wrapper around the Kafka producer.
 * Events are emitted asynchronously — callers should NOT await this in the
 * request hot-path (call without await after res.json has been sent).
 *
 * If the producer is not connected (Kafka down), the error is logged and
 * the caller is never impacted.
 */

const { producer } = require('../config/kafka');

/**
 * Emit a task lifecycle event to the `task-events` Kafka topic.
 *
 * @param {'task_created'|'task_updated'|'task_completed'|'task_deleted'} eventType
 * @param {object} payload - Must include at least { taskId }
 */
async function emitTaskEvent(eventType, payload) {
  try {
    await producer.send({
      topic: 'task-events',
      messages: [{
        key: payload.taskId ? String(payload.taskId) : 'unknown',
        value: JSON.stringify({
          eventType,
          ...payload,
          timestamp: Date.now(),
        }),
      }],
    });
    console.log(`📨 Kafka [task-events]: ${eventType} — task ${payload.taskId}`);
  } catch (err) {
    // Non-fatal: Kafka being down must never break the API
    console.error(`⚠️  Kafka emit failed (${eventType}):`, err.message);
  }
}

module.exports = { emitTaskEvent };
