const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const { getIo } = require("../sockets/socket"); 

class NotificationService {
  async createNotification({ recipientId, senderId, type, entityId, entityModel, body, deepLink }) {
    // Don't notify self
    if (recipientId.toString() === senderId.toString()) return null;

    const recipient = await User.findById(recipientId).select("settings.notifications.push");
    if (recipient && recipient.settings && recipient.settings.notifications.push === false) {
      return null;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      entityId,
      entityModel,
      body,
      deepLink
    });

    const populatedNotif = await notification.populate("sender", "username displayName profilePicture isVerified isPrivate followRequests followers");

    // Realtime delivery via Socket.IO
    const io = getIo();
    if (io) {
      io.to(recipientId.toString()).emit("new notification", populatedNotif);
    }

    return populatedNotif;
  }

  async getUserNotifications(userId, limit = 20, skip = 0) {
    const rawNotifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1, timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username displayName profilePicture isVerified isPrivate followRequests followers settings");

    const currentUserIdStr = userId.toString();

    return rawNotifications.map((notif) => {
      const notifObj = notif.toObject();
      if (notifObj.sender && typeof notifObj.sender === "object") {
        const sender = notifObj.sender;
        const isPrivate = sender.isPrivate === true || sender.settings?.privacy?.profileVisibility === "private";
        const isRequested = sender.followRequests?.some((id) => id.toString() === currentUserIdStr) || false;
        const isFollowing = sender.followers?.some((id) => id.toString() === currentUserIdStr) || false;
        const relationshipStatus = isFollowing ? "following" : (isRequested ? "requested" : "none");

        delete sender.followRequests;
        delete sender.followers;
        delete sender.settings;

        notifObj.sender = {
          ...sender,
          isPrivate,
          isRequested,
          isFollowing,
          relationshipStatus
        };
      }
      return notifObj;
    });
  }

  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
  }

  async deleteNotification(notificationId, userId) {
    return await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
  }
}

module.exports = new NotificationService();
