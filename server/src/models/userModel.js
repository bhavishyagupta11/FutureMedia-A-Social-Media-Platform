const mongoose = require("mongoose");

const activeSessionSchema = new mongoose.Schema({
  token: { type: String, required: true },
  device: { type: String, default: "Unknown Device" },
  ipAddress: { type: String },
  lastActive: { type: Date, default: Date.now },
});

const userSettingsSchema = new mongoose.Schema({
  appearance: { type: String, enum: ["light", "dark", "system"], default: "system" },
  privacy: {
    messageRequests: { type: String, enum: ["everyone", "following", "none"], default: "everyone" },
    profileVisibility: { type: String, enum: ["public", "private"], default: "public" }
  },
  notifications: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true }
  },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  mutedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    username: { type: String, required: true, unique: true, trim: true },
    usernameLower: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password: { type: String, required: true },
    displayName: { type: String, default: "" },
    displayNameLower: { type: String, index: true, default: "" },
    
    // Profile Extended
    profilePicture: { type: String, default: "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-541.jpg" },
    coverImage: { type: String, default: "" },
    bio: { type: String, default: "" },
    website: { type: String, default: "" },
    location: { type: String, default: "" },
    profession: { type: String, default: "" },
    education: { type: String, default: "" },
    skills: [{ type: String }],
    socialLinks: {
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
      github: { type: String, default: "" }
    },
    gender: { type: String, default: "" },
    pronouns: { type: String, default: "" },

    // Metrics & AI Ready
    profileCompletion: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0, index: true },
    reputationScore: { type: Number, default: 0 },
    
    // Network
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    // Interactions
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    pinnedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    // State & Status
    role: { type: String, enum: ["user", "moderator", "admin", "superadmin"], default: "user" },
    isPrivate: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    accountStatus: { type: String, enum: ["active", "suspended", "deactivated"], default: "active" },
    onlineStatus: { type: String, enum: ["online", "offline", "away"], default: "offline" },
    lastSeen: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    joinedFrom: { type: String, default: "web" },

    // Security & Auth
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    emailVerificationCreatedAt: { type: Date, default: Date.now },
    emailVerificationLastSentAt: Date,
    pendingEmail: String,
    isEmailVerified: { type: Boolean, default: false },
    activeSessions: [activeSessionSchema],
    
    // Embedded Settings
    settings: { type: userSettingsSchema, default: () => ({}) }
  },
  { timestamps: true }
);

// Indexes for performance
userSchema.index({ createdAt: -1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

// Middleware to keep usernameLower and displayNameLower in sync
userSchema.pre('save', function () {
  if (this.isModified('username')) {
    this.usernameLower = this.username.toLowerCase();
  }
  if (this.isModified('displayName') && this.displayName) {
    this.displayNameLower = this.displayName.toLowerCase();
  }
});

module.exports = mongoose.model("User", userSchema);
