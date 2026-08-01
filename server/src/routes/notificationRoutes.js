const express = require("express");
const notificationService = require("../services/NotificationService");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const { successResponse } = require("../utils/responseHandler");

const router = express.Router();

router.get("/", protect, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = parseInt(req.query.skip, 10) || 0;
  const result = await notificationService.getUserNotifications(req.user.id, limit, skip);
  return successResponse(res, 200, "Notifications fetched", result);
}));

router.put("/:id/read", protect, asyncHandler(async (req, res) => {
  const result = await notificationService.markAsRead(req.params.id, req.user.id);
  return successResponse(res, 200, "Notification marked as read", result);
}));

router.put("/read-all", protect, asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  return successResponse(res, 200, "All notifications marked as read", null);
}));

router.delete("/:id", protect, asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user.id);
  return successResponse(res, 200, "Notification deleted", null);
}));

module.exports = router;
