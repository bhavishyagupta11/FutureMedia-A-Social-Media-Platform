const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const { hashPassword, verifyPassword } = require("../utils/password");
const env = require("../config/env");
const EmailService = require("./EmailService");
const LoggerService = require("./LoggerService");

const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET || "default_secret", {
    expiresIn: env.JWT_EXPIRE || "30d",
  });
};

const registerUser = async ({ username, email, password, deviceInfo, ipAddress }) => {
  const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { usernameLower: username.toLowerCase() }] });
  if (userExists) {
    const err = new Error("User already exists.");
    err.status = 400;
    throw err;
  }

  // Password strength check
  if (password.length < 8) {
    const err = new Error("Password must be at least 8 characters.");
    err.status = 400;
    throw err;
  }

  const hashedPassword = hashPassword(password);
  
  // Verification Token
  const verificationToken = crypto.randomBytes(20).toString("hex");

  const user = await User.create({
    username,
    usernameLower: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hashedPassword,
    emailVerificationToken: verificationToken,
    activeSessions: [] // Will add on login
  });

  let emailWarning = null;
  try {
    // Send verification email asynchronously but track success
    await EmailService.sendVerificationEmail(user, `${env.CLIENT_ORIGINS[0]}/verify/${verificationToken}`);
  } catch (e) {
    LoggerService.error("Email verification failed to send", e);
    emailWarning = "Verification email could not be sent because SMTP is not configured.";
  }

  LoggerService.security("User registered", { userId: user._id, email });

  const token = generateToken(user._id);
  user.activeSessions.push({ token, device: deviceInfo, ipAddress });
  await user.save();

  return {
    user: {
      _id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      token
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
    if (user.accountStatus !== "active") {
      const err = new Error("Account is " + user.accountStatus);
      err.status = 403;
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
      token
    };
  } else {
    const err = new Error("Invalid username or password");
    err.status = 401;
    throw err;
  }
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

module.exports = { registerUser, loginUser, logoutCurrentDevice, logoutAllDevices };
