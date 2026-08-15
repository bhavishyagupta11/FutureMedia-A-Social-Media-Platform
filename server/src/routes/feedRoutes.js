const express = require("express");
const feedService = require("../services/FeedService");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const { successResponse } = require("../utils/responseHandler");

const router = express.Router();

router.get("/home", protect, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const cursor = req.query.cursor || null;
  const result = await feedService.getFeed(req.user.id, limit, cursor);
  return successResponse(res, 200, "Home feed fetched", result);
}));

router.get("/explore", protect, asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const skip = parseInt(req.query.skip, 10) || 0;
  const result = await feedService.getExploreFeed(req.user.id, limit, skip);
  return successResponse(res, 200, "Explore feed fetched", result);
}));

router.get("/trending/hashtags", protect, asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 15, 30);
  const days = Math.min(parseInt(req.query.days, 10) || 7, 30);
  const result = await feedService.getTrendingHashtags(limit, days);
  return successResponse(res, 200, "Trending hashtags fetched", result);
}));

module.exports = router;
