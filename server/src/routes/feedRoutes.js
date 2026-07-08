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
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await feedService.getExploreFeed(req.user.id, limit);
  return successResponse(res, 200, "Explore feed fetched", result);
}));

module.exports = router;
