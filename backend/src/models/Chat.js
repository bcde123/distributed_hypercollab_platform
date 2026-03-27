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
      ref: "Workspace",
    },
    isEncrypted: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("Chat", chatSchema);