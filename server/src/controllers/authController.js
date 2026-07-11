const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/responseHandler");

exports.register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const deviceInfo = req.headers["user-agent"] || "Unknown Device";
  const ipAddress = req.ip;

  const result = await authService.registerUser({ username, email, password, deviceInfo, ipAddress });
  const { user, meta } = result;
  return successResponse(res, 201, "User registered successfully", user, meta);
});

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const deviceInfo = req.headers["user-agent"] || "Unknown Device";
  const ipAddress = req.ip;

  const result = await authService.loginUser({ username, password, deviceInfo, ipAddress });
  return successResponse(res, 200, "Login successful", result);
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const result = await authService.logoutCurrentDevice(req.user.id, token);
  return successResponse(res, 200, "Logged out successfully", result);
});

exports.logoutAll = asyncHandler(async (req, res) => {
  const result = await authService.logoutAllDevices(req.user.id);
  return successResponse(res, 200, "Logged out of all devices", result);
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  return successResponse(res, 200, "Password reset email sent", result);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPassword(token, newPassword);
  return successResponse(res, 200, "Password reset successfully", result);
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const result = await authService.verifyEmail(token);
  return successResponse(res, 200, "Email verified successfully", result);
});
