import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["dm", "channel"],
      required: true,
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
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);