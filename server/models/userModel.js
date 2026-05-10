const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    displayName: { type: String, default: "" },
    bio: { type: String, default: "" },
    website: { type: String, default: "" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    profilePicture: { type: String, default: "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-541.jpg" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
