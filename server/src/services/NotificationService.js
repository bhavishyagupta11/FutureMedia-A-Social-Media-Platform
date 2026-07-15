const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
// The actual socket emitter would be injected or required
// For now, we stub it until we refactor socket.js
const { getIo } = require("../sockets/socket"); 

class NotificationService {
  async createNotification({ recipientId, senderId, type, entityId, entityModel, body, deepLink }) {
    // Don't notify self
    if (recipientId.toString() === senderId.toString()) return null;

    const recipient = await User.findById(recipientId).select("settings.notifications.push");
    if (recipient && recipient.settings && recipient.settings.notifications.push === false) {
      return null; // User disabled push notifications
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

    const populatedNotif = await notification.populate("sender", "username displayName profilePicture");

    // Realtime delivery
    const io = getIo();
    if (io) {
      io.to(recipientId.toString()).emit("new notification", populatedNotif);
    }

    return populatedNotif;
  }

  async getUserNotifications(userId, limit = 20, skip = 0) {
    return await Notification.find({ recipient: userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username displayName profilePicture");
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
