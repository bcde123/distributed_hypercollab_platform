/**
 * WebSocket Broadcast Utility
 *
 * Provides a clean API for controllers to broadcast structured events
 * to workspace rooms without directly importing socket internals.
 *
 * Workspace rooms use the key format: "workspace:<workspaceId>"
 */

const WebSocket = require("ws");

/**
 * Broadcast a structured message to all clients in a workspace room.
 *
 * @param {string} workspaceId - The workspace to broadcast to
 * @param {object} message     - { type, payload } to send
 * @param {WebSocket} [excludeWs] - Optional socket to skip (the sender)
 */
function broadcastToRoom(workspaceId, message, excludeWs = null) {
  const roomKey = `workspace:${workspaceId}`;
  const rooms = global.wsRooms;
  if (!rooms) return;

  const room = rooms.get(roomKey);
  if (!room) return;

  const data = JSON.stringify(message);
  for (const client of room) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

module.exports = { broadcastToRoom };
