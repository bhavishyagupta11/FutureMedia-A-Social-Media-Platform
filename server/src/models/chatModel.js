const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    isGroupChat: { type: Boolean, default: false },
    chatName: { type: String, trim: true },
    chatImage: { type: String, default: "" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
