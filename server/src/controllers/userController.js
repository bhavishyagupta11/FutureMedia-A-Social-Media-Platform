const userService = require("../services/user.service");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/responseHandler");

exports.getProfile = asyncHandler(async (req, res) => {
  const identifier = (!req.params.id || req.params.id === "me") ? req.user.id : req.params.id;
  const result = await userService.getUser(identifier);
  return successResponse(res, 200, "Profile fetched", result);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  if (req.file) {
    req.body.profilePicture = req.file.path && req.file.path.startsWith("http") ? req.file.path : `/uploads/${req.file.filename}`;
  }
  const result = await userService.updateProfile(req.user.id, req.body);
  return successResponse(res, 200, "Profile updated", result);
});

exports.searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const result = await userService.searchUsers(query, req.user ? req.user.id : null);
  return successResponse(res, 200, "Search results", result);
});

exports.getSuggestedUsers = asyncHandler(async (req, res) => {
  const result = await userService.getSuggestedUsers(req.user.id);
  return successResponse(res, 200, "Suggested users", result);
});

exports.followUser = asyncHandler(async (req, res) => {
  const result = await userService.followUser(req.params.id, req.user.id);
  return successResponse(res, 200, "Follow action completed", result);
});

exports.unfollowUser = asyncHandler(async (req, res) => {
  const result = await userService.unfollowUser(req.params.id, req.user.id);
  return successResponse(res, 200, "Unfollow action completed", result);
});

exports.acceptFollowRequest = asyncHandler(async (req, res) => {
  const result = await userService.acceptFollowRequest(req.params.requesterId, req.user.id);
  return successResponse(res, 200, "Follow request accepted", result);
});

exports.rejectFollowRequest = asyncHandler(async (req, res) => {
  const result = await userService.rejectFollowRequest(req.params.requesterId, req.user.id);
  return successResponse(res, 200, "Follow request rejected", result);
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers();
  return successResponse(res, 200, "All users fetched", result);
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const result = await userService.updateSettings(req.user.id, req.body);
  return successResponse(res, 200, "Settings updated", result);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
  return successResponse(res, 200, "Password updated", result);
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const result = await userService.deleteAccount(req.user.id);
  return successResponse(res, 200, "Account deleted", result);
});
