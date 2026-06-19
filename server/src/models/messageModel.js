const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  type: { type: String, enum: ["image", "video", "document", "audio"], required: true },
  url: { type: String, required: true },
  optimizedUrl: { type: String },
  thumbnailUrl: { type: String },
  public_id: { type: String },
  size: { type: Number }, // bytes
  duration: { type: Number }, // seconds, for audio/video
  format: { type: String },
  name: { type: String }
}, { _id: false });

const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  emoji: { type: String, required: true }
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true, default: "" },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    
    // Status
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    // Attachments
    attachments: [attachmentSchema],
    
    // Interactions
    reactions: [reactionSchema],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
