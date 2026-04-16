const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");

// ── Create or get existing chat ──────────────────────────────────────────
const createChat = async (req, res) => {
  try {
    const { type, workspaceId, members, name, kemCipherText } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!type || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    // For DMs, find existing chat between these two users
    if (type === "dm") {
      const dmMembers = [...new Set([userId, ...members])];
      if (dmMembers.length !== 2) {
        return res.status(400).json({ message: "DM must have exactly 2 members" });
      }

      const existingDM = await Chat.findOne({
        type: "dm",
        members: { $all: dmMembers, $size: 2 },
      }).populate("members", "username email publicKey lastMessage");

      if (existingDM) {
        return res.status(200).json(existingDM);
      }

      // Create new DM with E2E encryption data
      const newDM = await Chat.create({
        type: "dm",
        workspaceId: workspaceId || null,
        members: dmMembers,
        isEncrypted: !!kemCipherText,
        kemCipherText: kemCipherText || null,
        initiator: userId,
      });

      const populated = await Chat.findById(newDM._id).populate("members", "username email publicKey");
      return res.status(201).json(populated);
    }

    // For channels
    if (type === "channel") {
      const channelMembers = [...new Set([userId, ...members])];
      const newChannel = await Chat.create({
        type: "channel",
        workspaceId: workspaceId || null,
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

// ── Get all chats for a workspace ────────────────────────────────────────
const getWorkspaceChats = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId || req.user.id;

    const chats = await Chat.find({
      workspaceId,
      members: userId,
    })
      .populate("members", "username email publicKey")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username" },
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json(chats);
  } catch (error) {
    console.error("Get Workspace Chats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Get all chats for the authenticated user ─────────────────────────────
const getMyChats = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { workspaceId } = req.query;

    const filter = { members: userId };
    if (workspaceId) filter.workspaceId = workspaceId;

    const chats = await Chat.find(filter)
      .populate("members", "username email publicKey")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username" },
      })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json(chats);
  } catch (error) {
    console.error("Get My Chats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Send a message ───────────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { chatId, content, nonce } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!chatId || !content) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify membership
    const isMember = chat.members.some(
      (m) => m.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this chat" });
    }

    const message = await Message.create({
      chatId,
      sender: userId,
      content,
      nonce: nonce || null,
    });

    // Update lastMessage pointer on Chat
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    // Populate sender for response
    const populated = await Message.findById(message._id)
      .populate("sender", "username email")
      .lean();

    // Broadcast via WebSocket
    if (global.wsBroadcast) {
      global.wsBroadcast(chatId, {
        type: "new_message",
        payload: populated,
      });
    }

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
    const userId = req.user.userId || req.user.id;

    const chat = await Chat.findById(chatId).lean();
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify membership
    const isMember = chat.members.some(
      (m) => m.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this chat" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username email")
      .lean();

    const total = await Message.countDocuments({ chatId });

    return res.status(200).json({
      messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Get online users (WebSocket presence) ────────────────────────────────
const getOnlineUsers = async (req, res) => {
  try {
    const onlineList = [];
    if (global.wsConnections) {
      const seen = new Set();
      for (const [, meta] of global.wsConnections) {
        if (!seen.has(meta.userId)) {
          seen.add(meta.userId);
          onlineList.push({ userId: meta.userId, username: meta.username });
        }
      }
    }
    return res.status(200).json(onlineList);
  } catch (error) {
    console.error("Get Online Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  createChat,
  getMyChats,
  getWorkspaceChats,
  getUserPublicKey,
  getOnlineUsers,
};
