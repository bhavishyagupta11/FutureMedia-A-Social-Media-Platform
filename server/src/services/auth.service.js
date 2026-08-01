const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const { hashPassword, verifyPassword } = require("../utils/password");
const env = require("../config/env");
const EmailService = require("./EmailService");
const LoggerService = require("./LoggerService");

const hashToken = (rawToken) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET || "default_secret", {
    expiresIn: env.JWT_EXPIRE || "30d",
  });
};

const registerUser = async ({ username, email, password, deviceInfo, ipAddress }) => {
  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();

  const userExists = await User.findOne({
    $or: [{ email: trimmedEmail.toLowerCase() }, { usernameLower: trimmedUsername.toLowerCase() }]
  });
  if (userExists) {
    const err = new Error("User already exists with that email or username");
    err.status = 409;
    err.code = "USER_EXISTS";
    throw err;
  }

  // Password strength check
  if (password.length < 8) {
    const err = new Error("Password must be at least 8 characters.");
    err.status = 400;
    err.code = "WEAK_PASSWORD";
    throw err;
  }

  const hashedPassword = hashPassword(password);
  
  // Secure 32-byte raw token string & SHA-256 hash in DB
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);

  const user = await User.create({
    username: trimmedUsername,
    usernameLower: trimmedUsername.toLowerCase(),
    email: trimmedEmail.toLowerCase(),
    password: hashedPassword,
    emailVerificationToken: hashedToken,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Hours
    emailVerificationCreatedAt: new Date(),
    emailVerificationLastSentAt: new Date(),
    isEmailVerified: false,
    activeSessions: []
  });

  let emailWarning = null;
  const verifyUrl = `${env.CLIENT_ORIGINS[0]}/verify/${rawToken}`;
  try {
    const emailResult = await EmailService.sendVerificationEmail(user, verifyUrl);
    if (emailResult && emailResult.warning) {
      emailWarning = emailResult.warning;
    }
  } catch (e) {
    LoggerService.error("Email verification failed to send", e);
    emailWarning = "Verification email could not be sent because SMTP is not configured.";
  }

  LoggerService.security("User registered", { userId: user._id, email });

  return {
    user: {
      _id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified
    },
    meta: emailWarning ? { warning: emailWarning } : null
  };
};

const loginUser = async ({ username, password, deviceInfo, ipAddress }) => {
  const user = await User.findOne({
    $or: [
      { usernameLower: username.toLowerCase() },
      { email: username.toLowerCase() }
    ]
  });

  if (user && verifyPassword(password, user.password)) {
    if (!user.isEmailVerified) {
      const err = new Error("Please verify your email address to log in.");
      err.status = 403;
      err.code = "EMAIL_NOT_VERIFIED";
      err.canResend = true;
      err.nextAction = "RESEND_VERIFICATION";
      LoggerService.security("Login blocked due to unverified account", { userId: user._id });
      throw err;
    }

    if (user.accountStatus !== "active") {
      const err = new Error("Account is " + user.accountStatus);
      err.status = 403;
      err.code = "ACCOUNT_INACTIVE";
      throw err;
    }

    const token = generateToken(user._id);
    
    // Session management: Keep last 5 sessions
    user.activeSessions.push({ token, device: deviceInfo, ipAddress });
    if (user.activeSessions.length > 5) {
      user.activeSessions.shift();
    }
    user.lastActive = Date.now();
    user.onlineStatus = "online";
    await user.save();

    LoggerService.security("User logged in", { userId: user._id, ipAddress });

    return {
      _id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      token
    };
  } else {
    const err = new Error("Invalid username or password");
    err.status = 401;
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }
};

const verifyEmail = async (rawToken) => {
  if (!rawToken || typeof rawToken !== "string") {
    const err = new Error("Invalid verification token.");
    err.status = 400;
    err.code = "TOKEN_INVALID";
    throw err;
  }

  const hashedToken = hashToken(rawToken);
  const user = await User.findOne({ emailVerificationToken: hashedToken });

  if (!user) {
    const err = new Error("Invalid or already used verification token.");
    err.status = 400;
    err.code = "TOKEN_INVALID";
    LoggerService.info("Email verification failed: Invalid token");
    throw err;
  }

  // Already verified check
  if (user.isEmailVerified) {
    return {
      message: "Email address is already verified.",
      code: "ALREADY_VERIFIED"
    };
  }

  // Token Expiration check
  if (user.emailVerificationExpires && user.emailVerificationExpires.getTime() < Date.now()) {
    const err = new Error("Verification token has expired. Please request a new link.");
    err.status = 400;
    err.code = "TOKEN_EXPIRED";
    err.canResend = true;
    LoggerService.info("Email verification failed: Token expired", { userId: user._id });
    throw err;
  }

  // Mark verified & consume token
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  LoggerService.security("Email verification completed", { userId: user._id });

  return {
    message: "Email verified successfully!",
    code: "EMAIL_VERIFIED_SUCCESS"
  };
};

const resendVerification = async (email) => {
  if (!email || typeof email !== "string") {
    const err = new Error("Please provide a valid email address.");
    err.status = 400;
    err.code = "INVALID_INPUT";
    throw err;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: trimmedEmail });

  // Generic success to prevent email enumeration
  if (!user) {
    LoggerService.info("Resend verification requested for non-existent email", { email: trimmedEmail });
    return {
      message: "If an account exists with that email, a verification link has been sent.",
      code: "RESEND_SUCCESS"
    };
  }

  if (user.isEmailVerified) {
    return {
      message: "This email address is already verified.",
      code: "ALREADY_VERIFIED"
    };
  }

  // Rate Limiting Check (Min 60s between resends)
  if (user.emailVerificationLastSentAt && (Date.now() - new Date(user.emailVerificationLastSentAt).getTime()) < 60000) {
    const err = new Error("Please wait 60 seconds before requesting another verification email.");
    err.status = 429;
    err.code = "RESEND_TOO_SOON";
    LoggerService.info("Resend verification rate limited", { userId: user._id });
    throw err;
  }

  // Generate new token & 24h expiration
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.emailVerificationLastSentAt = new Date();
  await user.save();

  const verifyUrl = `${env.CLIENT_ORIGINS[0]}/verify/${rawToken}`;
  try {
    await EmailService.sendVerificationEmail(user, verifyUrl);
  } catch (e) {
    LoggerService.error("Resend verification email failed to send", e);
  }

  LoggerService.security("Resend verification email sent", { userId: user._id });

  return {
    message: "If an account exists with that email, a verification link has been sent.",
    code: "RESEND_SUCCESS"
  };
};

const logoutCurrentDevice = async (userId, token) => {
  const user = await User.findById(userId);
  if (user) {
    user.activeSessions = user.activeSessions.filter(s => s.token !== token);
    user.onlineStatus = "offline";
    user.lastSeen = Date.now();
    await user.save();
  }
  return { message: "Logged out successfully" };
};

const logoutAllDevices = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.activeSessions = [];
    user.onlineStatus = "offline";
    user.lastSeen = Date.now();
    await user.save();
  }
  return { message: "Logged out of all devices" };
};

const forgotPassword = async (email) => {
  if (!email || typeof email !== "string") {
    const err = new Error("Please provide a valid email address.");
    err.status = 400;
    err.code = "INVALID_INPUT";
    throw err;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: trimmedEmail });
  if (!user) {
    LoggerService.info("Password reset requested for non-existent email", { email: trimmedEmail });
    return { message: "If an account exists with that email, a password reset link has been sent.", code: "FORGOT_SUCCESS" };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000);
  await user.save();

  const resetUrl = `${env.CLIENT_ORIGINS[0]}/reset-password/${rawToken}`;
  try {
    await EmailService.sendPasswordResetEmail(user, resetUrl);
  } catch (e) {
    LoggerService.error("Password reset email failed to send", e);
  }

  LoggerService.security("Password reset token generated and sent", { userId: user._id, email: user.email });

  return { message: "Password reset link sent to your email.", code: "FORGOT_SUCCESS" };
};

const resetPassword = async (rawToken, newPassword) => {
  if (!rawToken || typeof rawToken !== "string") {
    const err = new Error("Invalid or missing reset token.");
    err.status = 400;
    err.code = "INVALID_TOKEN";
    throw err;
  }

  if (!newPassword || newPassword.length < 8) {
    const err = new Error("Password must be at least 8 characters long.");
    err.status = 400;
    err.code = "WEAK_PASSWORD";
    throw err;
  }

  const hashedToken = hashToken(rawToken);
  const user = await User.findOne({ resetPasswordToken: hashedToken });

  if (!user) {
    const err = new Error("Invalid or expired reset token");
    err.status = 400;
    err.code = "INVALID_TOKEN";
    LoggerService.info("Password reset failed: Invalid token");
    throw err;
  }

  if (user.resetPasswordExpires && user.resetPasswordExpires.getTime() < Date.now()) {
    const err = new Error("Reset token has expired. Please request a new password reset link.");
    err.status = 400;
    err.code = "TOKEN_EXPIRED";
    LoggerService.info("Password reset failed: Expired token", { userId: user._id });
    throw err;
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  LoggerService.security("Password reset completed successfully", { userId: user._id });

  return { message: "Password reset successful!", code: "RESET_SUCCESS" };
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  logoutCurrentDevice,
  logoutAllDevices,
  forgotPassword,
  resetPassword
};
