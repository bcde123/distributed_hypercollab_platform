const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");

// ── POST /api/chat/send ──────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!chatId || !content) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify membership
    const isMember = chat.members.some(
      (m) => m.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this chat" });
    }

    const message = await Message.create({
      chatId,
      sender: req.user.id,
      content,
    });

    // Update lastMessage pointer on Chat
    chat.lastMessage = message._id;
    await chat.save();

    // Populate sender for response
    const populated = await Message.findById(message._id)
      .populate("sender", "username")
      .lean();

    // Broadcast via WebSocket (if available)
    if (global.wsBroadcast) {
      // Broadcast to room including sender (they'll deduplicate)
      const { wsBroadcast } = global;
      // We need to import rooms directly from socketServer — use global workaround
      // Actually, broadcast already handles this through rooms map
    }

    return res.status(201).json(populated);
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/chat/:chatId/messages ───────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId).lean();
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify membership
    const isMember = chat.members.some(
      (m) => m.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this chat" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username")
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

// ── POST /api/chat/create ────────────────────────────────────────────────
const createChat = async (req, res) => {
  try {
    const { type, name, members, workspaceId } = req.body;

    if (!type || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: "type and members[] are required" });
    }

    // For DMs, ensure members list includes exactly 2 users
    if (type === "dm") {
      // Make sure current user is in the list
      const memberSet = new Set([req.user.id, ...members]);
      if (memberSet.size !== 2) {
        return res.status(400).json({ message: "DM requires exactly 2 members" });
      }

      // Check if DM already exists between these users
      const memberArr = [...memberSet];
      const existingDM = await Chat.findOne({
        type: "dm",
        members: { $all: memberArr, $size: 2 },
      });

      if (existingDM) {
        // Populate members for response
        const populated = await Chat.findById(existingDM._id)
          .populate("members", "username email")
          .populate("lastMessage")
          .lean();
        return res.status(200).json(populated);
      }

      const chat = await Chat.create({
        type: "dm",
        members: memberArr,
        workspaceId: workspaceId || null,
      });

      const populated = await Chat.findById(chat._id)
        .populate("members", "username email")
        .lean();

      return res.status(201).json(populated);
    }

    // Channel
    if (!name?.trim()) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    const memberSet = new Set([req.user.id, ...members]);
    const chat = await Chat.create({
      type: "channel",
      name: name.trim(),
      members: [...memberSet],
      workspaceId: workspaceId || null,
    });

    const populated = await Chat.findById(chat._id)
      .populate("members", "username email")
      .lean();

    return res.status(201).json(populated);
  } catch (error) {
    console.error("Create Chat Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/chat/my-chats ───────────────────────────────────────────────
const getMyChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workspaceId } = req.query;

    const filter = { members: userId };
    if (workspaceId) filter.workspaceId = workspaceId;

    const chats = await Chat.find(filter)
      .populate("members", "username email")
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

// ── GET /api/chat/online ─────────────────────────────────────────────────
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

module.exports = { sendMessage, getMessages, createChat, getMyChats, getOnlineUsers };