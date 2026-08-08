const Story = require("../models/storyModel");
const User = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/responseHandler");

exports.createStory = asyncHandler(async (req, res) => {
  const { mediaType, caption, text, background, fontSize, textColor } = req.body;

  let mediaUrl = "";
  let type = mediaType || "image";

  if (req.file) {
    mediaUrl = req.file.path && req.file.path.startsWith("http") 
      ? req.file.path 
      : `/uploads/${req.file.filename}`;
    type = req.file.mimetype.startsWith("video") ? "video" : "image";
  } else if (type === "text") {
    if (!text || !text.trim()) {
      const err = new Error("Text content is required for text story");
      err.status = 400;
      throw err;
    }
  } else {
    const err = new Error("No media file or text content provided for story");
    err.status = 400;
    throw err;
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Standard 24h story lifetime

  const story = await Story.create({
    userId: req.user.id,
    mediaUrl,
    mediaType: type,
    caption: caption || "",
    text: text || "",
    background: background || "linear-gradient(135deg, #4F46E5, #7C3AED)",
    fontSize: fontSize || "1.5rem",
    textColor: textColor || "#ffffff",
    expiresAt,
    seenBy: [{ user: req.user.id, viewedAt: new Date() }]
  });

  const populatedStory = await story.populate("userId", "username displayName profilePicture isPrivate");
  return successResponse(res, 201, "Story created", populatedStory);
});

exports.getFeedStories = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user.id).select("following");
  const followingIds = (currentUser?.following || []).map(id => id.toString());
  if (!followingIds.includes(req.user.id.toString())) {
    followingIds.push(req.user.id.toString());
  }

  const now = new Date();

  // Fetch active non-expired stories from followed users & self
  const stories = await Story.find({
    userId: { $in: followingIds },
    expiresAt: { $gt: now }
  })
    .populate("userId", "username displayName profilePicture isPrivate")
    .sort({ createdAt: 1 });

  // Group by user
  const groupedStoriesMap = {};
  stories.forEach(story => {
    if (!story.userId) return;
    const uid = story.userId._id.toString();
    if (!groupedStoriesMap[uid]) {
      groupedStoriesMap[uid] = {
        user: story.userId,
        stories: []
      };
    }
    groupedStoriesMap[uid].stories.push(story);
  });

  // Put current user's story group first if present
  const result = [];
  const myUid = req.user.id.toString();
  if (groupedStoriesMap[myUid]) {
    result.push(groupedStoriesMap[myUid]);
    delete groupedStoriesMap[myUid];
  }

  Object.values(groupedStoriesMap).forEach(group => {
    result.push(group);
  });

  return successResponse(res, 200, "Stories fetched", result);
});

exports.markStoryAsViewed = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) {
    const err = new Error("Story not found");
    err.status = 404;
    throw err;
  }

  const currentUserIdStr = req.user.id.toString();
  const alreadyViewed = story.seenBy.some(
    item => (item.user ? item.user.toString() : item.toString()) === currentUserIdStr
  );

  if (!alreadyViewed) {
    story.seenBy.push({ user: req.user.id, viewedAt: new Date() });
    await story.save();
  }

  return successResponse(res, 200, "Story marked as viewed", story);
});

exports.getStoryViewers = asyncHandler(async (req, res) => {
  const story = await Story.findOne({ _id: req.params.id, userId: req.user.id })
    .populate("seenBy.user", "username displayName profilePicture isVerified");

  if (!story) {
    const err = new Error("Story not found or unauthorized");
    err.status = 404;
    throw err;
  }

  const viewers = story.seenBy
    .filter(item => item.user)
    .map(item => ({
      _id: item.user._id,
      username: item.user.username,
      displayName: item.user.displayName,
      profilePicture: item.user.profilePicture,
      isVerified: item.user.isVerified,
      viewedAt: item.viewedAt
    }));

  return successResponse(res, 200, "Story viewers fetched", viewers);
});

exports.deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findOne({ _id: req.params.id, userId: req.user.id });
  if (!story) {
    const err = new Error("Story not found or unauthorized");
    err.status = 404;
    throw err;
  }
  await story.deleteOne();
  return successResponse(res, 200, "Story deleted", null);
});
