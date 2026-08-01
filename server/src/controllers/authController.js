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

  try {
    const result = await authService.loginUser({ username, password, deviceInfo, ipAddress });
    return successResponse(res, 200, "Login successful", result);
  } catch (err) {
    if (err.code === "EMAIL_NOT_VERIFIED") {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: err.message,
        canResend: true,
        nextAction: "RESEND_VERIFICATION"
      });
    }
    throw err;
  }
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
  try {
    const result = await authService.verifyEmail(token);
    return res.status(200).json({
      success: true,
      code: result.code || "EMAIL_VERIFIED_SUCCESS",
      message: result.message,
      data: result
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      success: false,
      code: err.code || "TOKEN_INVALID",
      message: err.message,
      canResend: err.canResend || false
    });
  }
});

exports.resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const result = await authService.resendVerification(email);
    return res.status(200).json({
      success: true,
      code: result.code || "RESEND_SUCCESS",
      message: result.message,
      data: result
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      success: false,
      code: err.code || "RESEND_FAILED",
      message: err.message
    });
  }
});
