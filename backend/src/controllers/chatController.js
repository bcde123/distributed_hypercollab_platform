const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");

// ── Create or get existing chat ──────────────────────────────────────────
const createChat = async (req, res) => {
  try {
    const { type, workspaceId, members, name, kemCipherText } = req.body;
    const userId = req.user.userId;

    if (!type || !workspaceId || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    // For DMs, find existing chat between these two users in this workspace
    if (type === "dm") {
      const dmMembers = [...new Set([userId, ...members])];
      if (dmMembers.length !== 2) {
        return res.status(400).json({ message: "DM must have exactly 2 members" });
      }

      const existingDM = await Chat.findOne({
        type: "dm",
        workspaceId,
        members: { $all: dmMembers, $size: 2 },
      }).populate("members", "username email publicKey");

      if (existingDM) {
        return res.status(200).json(existingDM);
      }

      // Create new DM with E2E encryption data
      const newDM = await Chat.create({
        type: "dm",
        workspaceId,
        members: dmMembers,
        isEncrypted: !!kemCipherText,
        kemCipherText: kemCipherText || null,
        initiator: userId,
      });

      const populated = await Chat.findById(newDM._id).populate("members", "username email publicKey");
      return res.status(201).json(populated);
    }

    // For channels (no E2E encryption)
    if (type === "channel") {
      const channelMembers = [...new Set([userId, ...members])];
      const newChannel = await Chat.create({
        type: "channel",
        workspaceId,
        name: name || "New Channel",
        members: channelMembers,
        isEncrypted: false,
      });

      const populated = await Chat.findById(newChannel._id).populate("members", "username email");
      return res.status(201).json(populated);
    }

    return res.status(400).json({ message: "Invalid chat type" });
  } catch (error) {
    console.error("Create Chat Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Get a user's public key (for KEM key exchange) ───────────────────────
const getUserPublicKey = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("publicKey username");
    if (!user || !user.publicKey) {
      return res.status(404).json({ message: "Public key not found for this user" });
    }
    return res.status(200).json({ userId: user._id, username: user.username, publicKey: user.publicKey });
  } catch (error) {
    console.error("Get Public Key Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Get all chats for a workspace (where current user is a member) ───────
const getWorkspaceChats = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    const chats = await Chat.find({
      workspaceId,
      members: userId,
    })
      .populate("members", "username email publicKey")
      .sort({ updatedAt: -1 });

    return res.status(200).json(chats);
  } catch (error) {
    console.error("Get Workspace Chats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Send a message (encrypted content + nonce for E2E) ───────────────────
const sendMessage = async (req, res) => {
  try {
    const { chatId, content, nonce } = req.body;
    const userId = req.user.userId;

    if (!chatId || !content) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const message = await Message.create({
      chatId,
      sender: userId,
      content,
      nonce: nonce || null,
    });

    // Populate sender info for the response & broadcast
    const populated = await Message.findById(message._id).populate("sender", "username email");

    // Broadcast via WebSocket
    if (global.wss) {
      const payload = JSON.stringify({
        type: "NEW_MESSAGE",
        message: populated,
      });
      global.wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(payload);
        }
      });
    }

    // Update the chat's updatedAt so it sorts to top
    chat.updatedAt = new Date();
    await chat.save();

    return res.status(201).json(populated);
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Get messages for a chat ──────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate("sender", "username email");

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createChat, getWorkspaceChats, getUserPublicKey, sendMessage, getMessages };