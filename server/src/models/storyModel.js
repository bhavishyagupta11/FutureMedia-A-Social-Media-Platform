const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mediaUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video", "text"], required: true },
    caption: { type: String, default: "" },
    text: { type: String, default: "" },
    background: { type: String, default: "linear-gradient(135deg, #4F46E5, #7C3AED)" },
    fontSize: { type: String, default: "1.5rem" },
    textColor: { type: String, default: "#ffffff" },
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

module.exports = mongoose.model("Story", storySchema);
