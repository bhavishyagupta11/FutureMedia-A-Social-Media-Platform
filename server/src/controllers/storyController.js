const Story = require("../models/storyModel");
const User = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/responseHandler");

exports.createStory = asyncHandler(async (req, res) => {
  const { mediaType, caption, text, background, fontSize, textColor, textAlign, fontFamily } = req.body;

  let mediaUrl = "";
  let type = mediaType || "image";

  if (req.file) {
    const isImage = req.file.mimetype.startsWith("image/");
    const isVideo = req.file.mimetype.startsWith("video/");
    if (!isImage && !isVideo) {
      const err = new Error("Invalid file format. Only images and videos are allowed.");
      err.status = 400;
      throw err;
    }

    mediaUrl = req.file.path && req.file.path.startsWith("http") 
      ? req.file.path 
      : `/uploads/${req.file.filename}`;
    type = isVideo ? "video" : "image";
  } else if (type === "text") {
    if (!text || !text.trim()) {
      const err = new Error("Text content is required for text story");
      err.status = 400;
      throw err;
    }
    if (text.trim().length > 280) {
      const err = new Error("Text story exceeds maximum character limit of 280");
      err.status = 400;
      throw err;
    }
  } else {
    const err = new Error("No media file or text content provided for story");
    err.status = 400;
    throw err;
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour lifetime

  const story = await Story.create({
    userId: req.user.id,
    mediaUrl,
    mediaType: type,
    caption: (caption || "").substring(0, 300),
    text: (text || "").substring(0, 280),
    background: background || "linear-gradient(135deg, #4F46E5, #7C3AED)",
    fontSize: fontSize || "1.5rem",
    textColor: textColor || "#ffffff",
    textAlign: ["left", "center", "right"].includes(textAlign) ? textAlign : "center",
    fontFamily: fontFamily || "sans-serif",
    expiresAt,
    seenBy: [{ user: req.user.id, viewedAt: new Date() }]
  });

  const populatedStory = await story.populate("userId", "username displayName profilePicture isPrivate");
  return successResponse(res, 201, "Story created", populatedStory);
});

exports.getFeedStories = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id.toString();
  const currentUser = await User.findById(req.user.id).select("following");
  const followingIds = (currentUser?.following || []).map(id => id.toString());
  if (!followingIds.includes(currentUserId)) {
    followingIds.push(currentUserId);
  }

  const now = new Date();

  // Also include public creators if following list is small
  const publicUsers = await User.find({ isPrivate: false, accountStatus: "active" }).select("_id");
  const publicIds = publicUsers.map(u => u._id.toString());
  const targetUserIds = [...new Set([...followingIds, ...publicIds])];

  // Fetch active non-expired stories from followed users & public creators
  const stories = await Story.find({
    userId: { $in: targetUserIds },
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

  const myGroup = groupedStoriesMap[currentUserId] || null;
  delete groupedStoriesMap[currentUserId];

  const unseenGroups = [];
  const seenGroups = [];

  Object.values(groupedStoriesMap).forEach(group => {
    const isFullySeen = group.stories.every(s =>
      s.seenBy?.some(v => (v.user ? v.user.toString() : v.toString()) === currentUserId)
    );
    if (isFullySeen) {
      seenGroups.push(group);
    } else {
      unseenGroups.push(group);
    }
  });

  // Ordering: Current User Story Group -> Unseen Creator Stories -> Seen Creator Stories
  const result = [
    ...(myGroup ? [myGroup] : []),
    ...unseenGroups,
    ...seenGroups
  ];

  return successResponse(res, 200, "Stories fetched", result);
});

exports.getUserStories = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user.id.toString();

  const targetUser = await User.findById(targetUserId)
    .select("username displayName profilePicture isPrivate followers settings");

  if (!targetUser) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // Privacy Validation
  if (targetUserId !== currentUserId) {
    const isPrivate = targetUser.isPrivate === true || targetUser.settings?.privacy?.profileVisibility === "private";
    const isFollower = targetUser.followers?.some(id => id.toString() === currentUserId);
    
    if (isPrivate && !isFollower) {
      const err = new Error("This account is private. Follow to view stories.");
      err.status = 403;
      throw err;
    }
  }

  const now = new Date();
  const stories = await Story.find({
    userId: targetUserId,
    expiresAt: { $gt: now }
  }).sort({ createdAt: 1 });

  if (stories.length === 0) {
    return successResponse(res, 200, "No active stories", null);
  }

  return successResponse(res, 200, "User stories fetched", {
    user: {
      _id: targetUser._id,
      username: targetUser.username,
      displayName: targetUser.displayName,
      profilePicture: targetUser.profilePicture
    },
    stories
  });
});

exports.markStoryAsViewed = asyncHandler(async (req, res) => {
  const storyId = req.params.id;
  const currentUserId = req.user.id;

  const story = await Story.findById(storyId);
  if (!story) {
    const err = new Error("Story not found");
    err.status = 404;
    throw err;
  }

  const currentUserIdStr = currentUserId.toString();
  const alreadyViewed = story.seenBy.some(
    item => (item.user ? item.user.toString() : item.toString()) === currentUserIdStr
  );

  if (!alreadyViewed) {
    // Atomic update using $addToSet / $push to avoid race conditions
    await Story.updateOne(
      { _id: storyId, "seenBy.user": { $ne: currentUserId } },
      { $push: { seenBy: { user: currentUserId, viewedAt: new Date() } } }
    );
  }

  const updatedStory = await Story.findById(storyId);
  return successResponse(res, 200, "Story marked as viewed", updatedStory);
});

exports.getStoryViewers = asyncHandler(async (req, res) => {
  const story = await Story.findOne({ _id: req.params.id, userId: req.user.id })
    .populate("seenBy.user", "username displayName profilePicture isVerified");

  if (!story) {
    const err = new Error("Story not found or unauthorized to view viewers");
    err.status = 403;
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
    err.status = 403;
    throw err;
  }
  await story.deleteOne();
  return successResponse(res, 200, "Story deleted", null);
});
