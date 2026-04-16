const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["dm", "channel"],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "workspace",
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    // Kyber KEM ciphertext — used by the receiver to derive the shared secret
    kemCipherText: {
      type: String,
      default: null,
    },
    // Who performed the encapsulation (the other member decapsulates)
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast lookups of chats by workspace
chatSchema.index({ workspaceId: 1 });
// Index for finding DMs between two users
chatSchema.index({ members: 1, type: 1 });

module.exports = mongoose.model("Chat", chatSchema);