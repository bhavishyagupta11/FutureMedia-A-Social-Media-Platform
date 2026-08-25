const mongoose = require("mongoose");
const User = require("../models/userModel");
const LoggerService = require("./LoggerService");

const getUser = async (identifier) => {
  let query;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query = { $or: [{ _id: identifier }, { usernameLower: identifier.toLowerCase() }] };
  } else {
    query = { usernameLower: identifier.toLowerCase() };
  }

  const user = await User.findOne(query)
    .select("-password -__v -resetPasswordToken -resetPasswordExpires -emailVerificationToken -activeSessions")
    .populate("followers", "username displayName profilePicture isVerified")
    .populate("following", "username displayName profilePicture isVerified");

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return user;
};

const NON_TEST_FILTER = {
  username: { $not: /^integration_test_|^vuser_|^user_\d+|^test_user|^testuser/i },
  accountStatus: "active"
};

const getAllUsers = async () => {
  return await User.find(NON_TEST_FILTER).select("-password -__v");
};

const getSuggestedUsers = async (userId) => {
  const currentUser = await User.findById(userId).select("following");
  const excludeIds = [...(currentUser?.following || []), userId];

  let suggestions = await User.find({ _id: { $nin: excludeIds }, ...NON_TEST_FILTER })
    .select("username displayName profilePicture bio profession location isVerified isPrivate followRequests followers settings")
    .sort({ engagementScore: -1 })
    .limit(10);

  if (suggestions.length < 5) {
    suggestions = await User.find({ _id: { $ne: userId }, ...NON_TEST_FILTER })
      .select("username displayName profilePicture bio profession location isVerified isPrivate followRequests followers settings")
      .sort({ engagementScore: -1 })
      .limit(10);
  }

  return suggestions.map((user) => {
    const isPrivate = user.isPrivate === true || user.settings?.privacy?.profileVisibility === "private";
    const isRequested = user.followRequests?.some((id) => id.toString() === userId.toString()) || false;
    const isFollowing = user.followers?.some((id) => id.toString() === userId.toString()) || false;
    const status = isFollowing ? "following" : (isRequested ? "requested" : "none");

    const userObj = user.toObject();
    delete userObj.followRequests;
    delete userObj.followers;
    delete userObj.settings;

    return {
      ...userObj,
      isPrivate,
      isRequested,
      isFollowing,
      status
    };
  });
};

const calculateProfileCompletion = (userObj) => {
  const fields = ['displayName', 'bio', 'location', 'profession', 'coverImage'];
  let filled = 0;
  fields.forEach(f => {
    if (userObj[f] && userObj[f] !== "") filled++;
  });
  return Math.round((filled / fields.length) * 100);
};

const ALLOWED_PROFILE_FIELDS = [
  'displayName', 'username', 'bio', 'website', 'location', 'profession', 'education',
  'skills', 'socialLinks', 'gender', 'pronouns', 'coverImage', 'profilePicture',
  'isPrivate'
];

const updateProfile = async (id, data) => {
  const user = await User.findById(id);
  if (!user) throw new Error("User not found");

  if (data.username) {
    const cleanUsername = data.username.trim().replace(/^@/, '');
    if (cleanUsername !== user.username) {
      if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
        const err = new Error("Username can only contain alphanumeric characters, dots, and underscores");
        err.status = 400;
        throw err;
      }
      const existing = await User.findOne({
        usernameLower: cleanUsername.toLowerCase(),
        _id: { $ne: id }
      });
      if (existing) {
        const err = new Error("Username is already taken");
        err.status = 400;
        throw err;
      }
      user.username = cleanUsername;
      user.usernameLower = cleanUsername.toLowerCase();
    }
  }

  // Whitelist fields to prevent mass-assignment of role, isVerified, accountStatus, etc.
  const sanitized = Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== 'username' && ALLOWED_PROFILE_FIELDS.includes(key))
  );
  Object.assign(user, sanitized);
  user.profileCompletion = calculateProfileCompletion(user);
  
  await user.save();
  return await User.findById(id).select("-password -__v");
};

const searchUsers = async (query, currentUserId) => {
  if (!query || typeof query !== "string") return [];
  
  let q = query.trim();
  if (q.startsWith("@")) {
    q = q.substring(1).trim();
  }
  if (!q) return [];

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const filter = {
    $and: [
      {
        $or: [
          { accountStatus: "active" },
          { accountStatus: { $exists: false } }
        ]
      },
      {
        $or: [
          { username: regex },
          { usernameLower: regex },
          { displayName: regex },
          { displayNameLower: regex }
        ]
      }
    ]
  };

  const users = await User.find(filter)
    .select("username displayName profilePicture bio isVerified isPrivate followRequests followers settings")
    .limit(20);

  return users.map((user) => {
    const isPrivate = user.isPrivate === true || user.settings?.privacy?.profileVisibility === "private";
    const isRequested = currentUserId && user.followRequests?.some((id) => id.toString() === currentUserId.toString()) || false;
    const isFollowing = currentUserId && user.followers?.some((id) => id.toString() === currentUserId.toString()) || false;
    const status = isFollowing ? "following" : (isRequested ? "requested" : "none");

    const userObj = user.toObject();
    delete userObj.followRequests;
    delete userObj.followers;
    delete userObj.settings;

    return {
      ...userObj,
      isPrivate,
      isRequested,
      isFollowing,
      status
    };
  });
};

const followUser = async (targetIdentifier, currentUserId) => {
  let targetUser;
  if (mongoose.Types.ObjectId.isValid(targetIdentifier)) {
    targetUser = await User.findOne({ $or: [{ _id: targetIdentifier }, { usernameLower: targetIdentifier.toLowerCase() }] });
  } else {
    targetUser = await User.findOne({ usernameLower: targetIdentifier.toLowerCase() });
  }

  const currentUser = await User.findById(currentUserId);

  if (!targetUser || !currentUser) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const targetId = targetUser._id.toString();

  if (targetId === currentUserId) {
    const err = new Error("You cannot follow yourself");
    err.status = 400;
    throw err;
  }

  const isAlreadyFollowing = currentUser.following.some(id => id.toString() === targetId);

  const isPrivate = targetUser.isPrivate === true || targetUser.settings?.privacy?.profileVisibility === "private";

  if (isPrivate && !isAlreadyFollowing) {
    if (!targetUser.followRequests.some(id => id.toString() === currentUserId)) {
      targetUser.followRequests.push(currentUserId);
      await targetUser.save();

      const NotificationService = require("./NotificationService");
      await NotificationService.createNotification({
        recipientId: targetId,
        senderId: currentUserId,
        type: "follow_request",
        entityId: currentUserId,
        entityModel: "User",
        body: "requested to follow you",
        deepLink: `/profile/${currentUser.username}`
      });

      return { message: "Follow request sent", status: "requested", requested: true, following: false, isPrivate: true };
    }
    return { message: "Follow request already sent", status: "requested", requested: true, following: false, isPrivate: true };
  }

  if (!isAlreadyFollowing) {
    currentUser.following.push(targetId);
    targetUser.followers.push(currentUserId);
    targetUser.engagementScore += 5;
    await currentUser.save();
    await targetUser.save();
    
    const NotificationService = require("./NotificationService");
    await NotificationService.createNotification({
      recipientId: targetId,
      senderId: currentUserId,
      type: "follow",
      entityId: currentUserId,
      entityModel: "User",
      body: "started following you",
      deepLink: `/profile/${currentUser.username}`
    });

    return { message: "User followed successfully", status: "following", following: true, requested: false, isPrivate: false };
  } else {
    return { message: "Already following this user", status: "following", following: true, requested: false, isPrivate };
  }
};

const unfollowUser = async (targetIdentifier, currentUserId) => {
  let targetUser;
  if (mongoose.Types.ObjectId.isValid(targetIdentifier)) {
    targetUser = await User.findOne({ $or: [{ _id: targetIdentifier }, { usernameLower: targetIdentifier.toLowerCase() }] });
  } else {
    targetUser = await User.findOne({ usernameLower: targetIdentifier.toLowerCase() });
  }

  const currentUser = await User.findById(currentUserId);

  if (!targetUser || !currentUser) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const targetId = targetUser._id.toString();

  if (currentUser.following.some(id => id.toString() === targetId)) {
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
    await currentUser.save();
    await targetUser.save();
    return { message: "User unfollowed successfully", status: "none", following: false, requested: false };
  } else if (targetUser.followRequests.some(id => id.toString() === currentUserId)) {
    targetUser.followRequests = targetUser.followRequests.filter(id => id.toString() !== currentUserId);
    await targetUser.save();
    return { message: "Follow request canceled", status: "none", following: false, requested: false };
  }

  return { message: "Not following user", status: "none", following: false, requested: false };
};

const acceptFollowRequest = async (requesterId, currentUserId) => {
  const currentUser = await User.findById(currentUserId);
  const requester = await User.findById(requesterId);

  if (!currentUser || !requester) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
  if (!currentUser.followers.some(id => id.toString() === requesterId)) {
    currentUser.followers.push(requesterId);
  }
  if (!requester.following.some(id => id.toString() === currentUserId)) {
    requester.following.push(currentUserId);
  }

  await currentUser.save();
  await requester.save();

  const Notification = require("../models/notificationModel");
  await Notification.updateMany(
    { recipient: currentUserId, sender: requesterId, type: "follow_request" },
    { type: "follow", body: "accepted follow request" }
  );

  const NotificationService = require("./NotificationService");
  await NotificationService.createNotification({
    recipientId: requesterId,
    senderId: currentUserId,
    type: "follow",
    entityId: currentUserId,
    entityModel: "User",
    body: "accepted your follow request",
    deepLink: `/profile/${currentUser.username}`
  });

  return { message: "Follow request accepted", status: "following" };
};

const rejectFollowRequest = async (requesterId, currentUserId) => {
  const currentUser = await User.findById(currentUserId);
  if (!currentUser) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
  await currentUser.save();

  const Notification = require("../models/notificationModel");
  await Notification.deleteMany({
    recipient: currentUserId,
    sender: requesterId,
    type: "follow_request"
  });

  return { message: "Follow request rejected", status: "none" };
};

const updateSettings = async (userId, settingsData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (typeof settingsData.isPrivate === "boolean") {
    user.isPrivate = settingsData.isPrivate;
  }
  if (settingsData.privacy?.profileVisibility) {
    user.isPrivate = settingsData.privacy.profileVisibility === "private";
  }

  const existing = user.settings?.toObject?.() || {};

  // Deep merge notifications to avoid overwriting one setting with the other
  if (settingsData.notifications) {
    settingsData.notifications = {
      ...(existing.notifications || {}),
      ...settingsData.notifications
    };
  }

  user.settings = { ...existing, ...settingsData };
  delete user.settings.isPrivate;
  await user.save();

  return { settings: user.settings, isPrivate: user.isPrivate };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const { verifyPassword, hashPassword } = require("../utils/password");
  if (!verifyPassword(currentPassword, user.password)) {
    const err = new Error("Current password is incorrect");
    err.status = 400;
    throw err;
  }

  if (newPassword.length < 8) {
    const err = new Error("New password must be at least 8 characters");
    err.status = 400;
    throw err;
  }

  user.password = hashPassword(newPassword);
  user.activeSessions = [];
  await user.save();

  return { message: "Password updated successfully" };
};

const deleteAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  await User.updateMany({ followers: userId }, { $pull: { followers: userId } });
  await User.updateMany({ following: userId }, { $pull: { following: userId } });
  await User.updateMany({ followRequests: userId }, { $pull: { followRequests: userId } });

  await User.findByIdAndDelete(userId);

  return { message: "Account deleted successfully" };
};

module.exports = {
  getUser,
  getAllUsers,
  getSuggestedUsers,
  updateProfile,
  searchUsers,
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  updateSettings,
  changePassword,
  deleteAccount,
};
