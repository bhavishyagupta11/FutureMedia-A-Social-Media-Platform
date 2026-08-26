const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    title: { type: String, default: "" },
    body: { type: String, required: true },
    
    type: { 
      type: String, 
      enum: ["like", "comment", "reply", "follow", "follow_request", "follow_accept", "mention", "message", "system"], 
      required: true 
    },
    
    // The related entity (Post, Comment, Chat, etc.)
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityModel: { type: String, enum: ["Post", "Comment", "Chat", "User", "System"] },
    
    metadata: { type: mongoose.Schema.Types.Mixed }, // Arbitrary data for frontend rendering
    deepLink: { type: String }, // Optional direct link (e.g., /post/123?comment=456)
    
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

// Compound index for user notification feed queries
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
