const express = require("express");
const router = express.Router();

const { verifyAccessToken } = require("../middleware/auth.js");
const { createChat, getWorkspaceChats, getUserPublicKey, sendMessage, getMessages } = require("../controllers/chatController");

// Create a new chat (DM or channel)
router.post("/create", verifyAccessToken, createChat);

// Get all chats for a workspace
router.get("/workspace/:workspaceId", verifyAccessToken, getWorkspaceChats);

// Get a user's public key for KEM key exchange
router.get("/publickey/:userId", verifyAccessToken, getUserPublicKey);

// Send a message
router.post("/send", verifyAccessToken, sendMessage);

// Get messages for a specific chat
router.get("/:chatId", verifyAccessToken, getMessages);

module.exports = router;