const Story = require("../models/storyModel");
const User = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/responseHandler");

exports.createStory = asyncHandler(async (req, res) => {
  if (!req.file) {
    const err = new Error("No media file provided for story");
    err.status = 400;
    throw err;
  }

  const mediaUrl = req.file.path && req.file.path.startsWith("http") ? req.file.path : `/uploads/${req.file.filename}`;
  const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

  const story = await Story.create({
    userId: req.user.id,
    mediaUrl,
    mediaType,
    caption: req.body.caption || "",
    expiresAt,
    seenBy: [req.user.id] // Mark as seen by self initially
  });

  const populatedStory = await story.populate("userId", "username displayName profilePicture");
  return successResponse(res, 201, "Story created", populatedStory);
});

exports.getFeedStories = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user.id);
  const followingIds = currentUser.following;
  followingIds.push(req.user.id); // Also fetch my own stories

  const stories = await Story.find({ userId: { $in: followingIds } })
    .populate("userId", "username displayName profilePicture")
    .sort({ createdAt: 1 }); // Sort by chronological order within groups

  // Group by user
  const groupedStories = {};
  stories.forEach(story => {
    const uid = story.userId._id.toString();
    if (!groupedStories[uid]) {
      groupedStories[uid] = {
        user: story.userId,
        stories: []
      };
    }
    groupedStories[uid].stories.push(story);
  });

  return successResponse(res, 200, "Stories fetched", Object.values(groupedStories));
});

exports.markStoryAsViewed = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) {
    const err = new Error("Story not found");
    err.status = 404;
    throw err;
  }

  if (!story.seenBy.includes(req.user.id)) {
    story.seenBy.push(req.user.id);
    await story.save();
  }

  return successResponse(res, 200, "Story marked as viewed", story);
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
