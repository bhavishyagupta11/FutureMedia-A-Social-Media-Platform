const mongoose = require("mongoose");

const hashtagSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    postCount: { type: Number, default: 0 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    trendScore: { type: Number, default: 0, index: true },
    category: { type: String, default: "general" },
    lastUsed: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hashtag", hashtagSchema);
