const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mediaUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video", "text"], required: true },
    caption: { type: String, default: "", maxLength: 300 },
    text: { type: String, default: "", maxLength: 280 },
    background: { type: String, default: "linear-gradient(135deg, #4F46E5, #7C3AED)" },
    fontSize: { type: String, default: "1.5rem" },
    textColor: { type: String, default: "#ffffff" },
    textAlign: { type: String, enum: ["left", "center", "right"], default: "center" },
    fontFamily: { type: String, default: "sans-serif" },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    seenBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        viewedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// Compound index for fast feed and user story queries
storySchema.index({ userId: 1, expiresAt: 1 });

module.exports = mongoose.model("Story", storySchema);
