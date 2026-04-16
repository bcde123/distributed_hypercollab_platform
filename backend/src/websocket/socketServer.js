/**
 * WebSocket Server — Room-aware, JWT-authenticated
 *
 * Message protocol (JSON over WS):
 *   → Client sends:  { type, payload }
 *   ← Server sends:  { type, payload }
 *
 * Types:
 *   auth          – client authenticates with JWT
 *   join_room     – join a chat room (chatId)
 *   leave_room    – leave a chat room
 *   send_message  – send a chat message
 *   typing        – typing indicator
 *   stop_typing   – stop typing indicator
 *   ping          – keep-alive
 *
 *   auth_ok       – server confirms auth
 *   auth_error    – server rejects auth
 *   new_message   – new message broadcast
 *   user_typing   – typing broadcast
 *   user_stop_typing – stop typing broadcast
 *   presence      – online user list update
 *   error         – generic error
 *   pong          – keep-alive reply
 */

const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const url = require("url");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");

// ── State ────────────────────────────────────────────────────────────────
// userId → Set<ws>  (a user may have multiple tabs)
const onlineUsers = new Map();
// chatId → Set<ws>
const rooms = new Map();
// ws → { userId, username }
const connections = new Map();

// ── Helpers ──────────────────────────────────────────────────────────────

function broadcast(chatId, message, excludeWs = null) {
  const room = rooms.get(chatId);
  if (!room) return;

  const data = JSON.stringify(message);
  for (const client of room) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function broadcastPresence() {
  const onlineList = [];
  for (const [userId, sockets] of onlineUsers) {
    if (sockets.size > 0) {
      const meta = connections.get([...sockets][0]);
      onlineList.push({ userId, username: meta?.username || "Unknown" });
    }
  }

  const payload = JSON.stringify({ type: "presence", payload: { users: onlineList } });

  // Send to every connected & authenticated client
  for (const [ws] of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function send(ws, type, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

// ── Init ─────────────────────────────────────────────────────────────────

function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, path: "/ws" });

  // Keep-alive interval (30 s)
  const heartbeat = setInterval(() => {
    for (const client of wss.clients) {
      if (client._isAlive === false) {
        connections.delete(client);
        return client.terminate();
      }
      client._isAlive = false;
      client.ping();
    }
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));

  wss.on("connection", (ws, req) => {
    ws._isAlive = true;
    ws.on("pong", () => { ws._isAlive = true; });

    // Optionally authenticate via query param: ?token=xxx
    const params = url.parse(req.url, true).query;
    if (params.token) {
      authenticateWs(ws, params.token);
    }

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return send(ws, "error", { message: "Invalid JSON" });
      }

      handleMessage(ws, msg);
    });

    ws.on("close", () => {
      cleanupConnection(ws);
    });
  });

  // Expose for REST controller to broadcast
  global.wss = wss;
  global.wsBroadcast = broadcast;
  global.wsConnections = connections;

  console.log("🔌 WebSocket server attached (path: /ws)");
  return wss;
}

// ── Auth ─────────────────────────────────────────────────────────────────

async function authenticateWs(ws, token) {
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.userId;

    // Fetch username
    const user = await User.findById(userId).select("username").lean();
    if (!user) {
      return send(ws, "auth_error", { message: "User not found" });
    }

    connections.set(ws, { userId, username: user.username });

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(ws);

    send(ws, "auth_ok", { userId, username: user.username });
    broadcastPresence();
  } catch (err) {
    send(ws, "auth_error", { message: "Invalid or expired token" });
  }
}

// ── Message Handler ──────────────────────────────────────────────────────

async function handleMessage(ws, msg) {
  const { type, payload } = msg;

  // Auth must come first for protected actions
  if (type === "auth") {
    return authenticateWs(ws, payload?.token);
  }

  if (type === "ping") {
    return send(ws, "pong", {});
  }

  // Everything else requires authentication
  const meta = connections.get(ws);
  if (!meta) {
    return send(ws, "error", { message: "Not authenticated. Send { type: 'auth', payload: { token } } first." });
  }

  switch (type) {
    case "join_room": {
      const { chatId } = payload || {};
      if (!chatId) return send(ws, "error", { message: "chatId required" });

      if (!rooms.has(chatId)) rooms.set(chatId, new Set());
      rooms.get(chatId).add(ws);

      // Store joined rooms on ws for cleanup
      if (!ws._rooms) ws._rooms = new Set();
      ws._rooms.add(chatId);

      send(ws, "joined_room", { chatId });
      break;
    }

    case "leave_room": {
      const { chatId } = payload || {};
      if (!chatId) return;

      rooms.get(chatId)?.delete(ws);
      ws._rooms?.delete(chatId);

      send(ws, "left_room", { chatId });
      break;
    }

    case "send_message": {
      const { chatId, content } = payload || {};
      if (!chatId || !content?.trim()) {
        return send(ws, "error", { message: "chatId and content required" });
      }

      // Verify chat exists and user is a member
      const chat = await Chat.findById(chatId).lean();
      if (!chat) return send(ws, "error", { message: "Chat not found" });

      const isMember = chat.members.some(
        (m) => m.toString() === meta.userId
      );
      if (!isMember) return send(ws, "error", { message: "Not a member of this chat" });

      // Persist to DB
      const message = await Message.create({
        chatId,
        sender: meta.userId,
        content: content.trim(),
      });

      // Populate sender for broadcast
      const populated = await Message.findById(message._id)
        .populate("sender", "username")
        .lean();

      const broadcastPayload = {
        type: "new_message",
        payload: {
          _id: populated._id,
          chatId: populated.chatId,
          sender: populated.sender,
          content: populated.content,
          createdAt: populated.createdAt,
        },
      };

      // Send to everyone in the room (including sender for confirmation)
      const room = rooms.get(chatId);
      if (room) {
        const data = JSON.stringify(broadcastPayload);
        for (const client of room) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        }
      }

      break;
    }

    case "typing": {
      const { chatId } = payload || {};
      if (!chatId) return;

      broadcast(chatId, {
        type: "user_typing",
        payload: { chatId, userId: meta.userId, username: meta.username },
      }, ws);
      break;
    }

    case "stop_typing": {
      const { chatId } = payload || {};
      if (!chatId) return;

      broadcast(chatId, {
        type: "user_stop_typing",
        payload: { chatId, userId: meta.userId, username: meta.username },
      }, ws);
      break;
    }

    default:
      send(ws, "error", { message: `Unknown message type: ${type}` });
  }
}

// ── Cleanup ──────────────────────────────────────────────────────────────

function cleanupConnection(ws) {
  const meta = connections.get(ws);
  if (meta) {
    // Remove from online tracking
    const userSockets = onlineUsers.get(meta.userId);
    if (userSockets) {
      userSockets.delete(ws);
      if (userSockets.size === 0) {
        onlineUsers.delete(meta.userId);
      }
    }
  }

  // Remove from all rooms
  if (ws._rooms) {
    for (const chatId of ws._rooms) {
      rooms.get(chatId)?.delete(ws);
    }
  }

  connections.delete(ws);
  broadcastPresence();
}

module.exports = { initWebSocketServer };
