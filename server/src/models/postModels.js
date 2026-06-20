const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  optimizedUrl: { type: String },
  thumbnailUrl: { type: String },
  width: { type: Number },
  height: { type: Number },
  format: { type: String },
  public_id: { type: String },
  type: { type: String, enum: ["image", "video"], required: true },
  altText: { type: String, default: "" },
  duration: { type: Number } // For videos
}, { _id: false });

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // Self-referencing via ID or nested array
    isPinned: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false }
  },
  { timestamps: true, _id: true }
);

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    media: [mediaSchema], // Supports multiple media/carousel
    caption: { type: String, default: "" },
    location: { type: String, default: "" },
    
    hashtags: [{ type: String, index: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    // State
    visibility: { type: String, enum: ["public", "private", "followers", "unlisted"], default: "public" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published" },
    isPinned: { type: Boolean, default: false },
    scheduledFor: { type: Date },

    // Atomic Counters
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0, index: true },

    // Arrays (can eventually be moved to separate relations for massive scale, but embedded for MVP)
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });

const postModel = mongoose.model("Post", postSchema);
module.exports = postModel;
