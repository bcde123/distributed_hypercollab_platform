const express = require("express");
const router = express.Router();

const { verifyAccessToken } = require("../middleware/auth.js");
const {
  sendMessage,
  getMessages,
  createChat,
  getMyChats,
  getOnlineUsers,
} = require("../controllers/chatController");

// Create a new chat (DM or channel)
router.post("/create", verifyAccessToken, createChat);

// Get all chats for the authenticated user
router.get("/my-chats", verifyAccessToken, getMyChats);

// Get online users (WebSocket presence)
router.get("/online", verifyAccessToken, getOnlineUsers);

// Send a message to a chat
router.post("/send", verifyAccessToken, sendMessage);

// Get messages for a chat (paginated)
router.get("/:chatId/messages", verifyAccessToken, getMessages);

module.exports = router;