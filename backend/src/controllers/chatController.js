import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    console.log("USER:", req.user);
    if (!chatId || !content) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const message = await Message.create({
      chatId,
      sender: req.user.id,
      content,
    });


    if (global.wss) {
        global.wss.clients.forEach((client) => {
            if (client.readyState === 1) {
            client.send(JSON.stringify(message));
            }
        });
    }

    return res.status(201).json(message);
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate("sender", "username");

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};