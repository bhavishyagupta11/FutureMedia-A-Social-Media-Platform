const mongoose = require("mongoose");
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");

const createChat = async (userId, targetIdentifier) => {
  let targetUser;
  if (mongoose.Types.ObjectId.isValid(targetIdentifier)) {
    targetUser = await User.findOne({ $or: [{ _id: targetIdentifier }, { usernameLower: String(targetIdentifier).toLowerCase() }] });
  } else {
    targetUser = await User.findOne({ usernameLower: String(targetIdentifier).toLowerCase() });
  }

  if (!targetUser) {
    const err = new Error("Target user not found");
    err.status = 404;
    throw err;
  }

  const targetId = targetUser._id.toString();

  let chat = await Chat.findOne({
    isGroupChat: false,
    participants: { $all: [userId, targetId] },
  }).populate("participants", "-password");

  if (chat) return chat;

  chat = await Chat.create({
    chatName: "sender",
    isGroupChat: false,
    participants: [userId, targetId],
  });

  return await Chat.findById(chat._id).populate("participants", "-password");
};

const getUserChats = async (userId) => {
  return await Chat.find({ participants: userId })
    .populate("participants", "-password")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });
};

const sendMessage = async (senderId, chatId, content, attachments = []) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    const err = new Error("Chat not found");
    err.status = 404;
    throw err;
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    const err = new Error("Chat not found");
    err.status = 404;
    throw err;
  }

  const isParticipant = chat.participants.some(
    (p) => p.toString() === senderId.toString()
  );
  if (!isParticipant) {
    const err = new Error("Unauthorized to send message to this chat");
    err.status = 403;
    throw err;
  }

  let message = await Message.create({
    sender: senderId,
    content,
    chat: chatId,
    attachments
  });

  message = await message.populate("sender", "username profilePicture");
  message = await message.populate("chat");
  message = await User.populate(message, {
    path: "chat.participants",
    select: "username profilePicture email",
  });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

  // Create notification for other chat participants
  if (chat.participants) {
    const NotificationService = require("./NotificationService");
    for (const participantId of chat.participants) {
      if (participantId.toString() !== senderId.toString()) {
        await NotificationService.createNotification({
          recipientId: participantId,
          senderId: senderId,
          type: "message",
          entityId: message._id,
          entityModel: "Chat",
          body: `sent you a message: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
          deepLink: "/messages"
        }).catch(console.error);
      }
    }
  }

  return message;
};

const getChatMessages = async (chatId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    const err = new Error("Chat not found");
    err.status = 404;
    throw err;
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    const err = new Error("Chat not found");
    err.status = 404;
    throw err;
  }

  if (userId) {
    const isParticipant = chat.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      const err = new Error("Unauthorized to access messages in this chat");
      err.status = 403;
      throw err;
    }
  }

  return await Message.find({ chat: chatId, isDeleted: false })
    .populate("sender", "username profilePicture email")
    .populate("chat")
    .sort({ createdAt: 1 });
};

const markMessagesAsRead = async (chatId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    const err = new Error("Chat not found");
    err.status = 404;
    throw err;
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    const err = new Error("Chat not found");
    err.status = 404;
    throw err;
  }

  if (userId) {
    const isParticipant = chat.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      const err = new Error("Unauthorized to access this chat");
      err.status = 403;
      throw err;
    }
  }

  await Message.updateMany(
    { chat: chatId, sender: { $ne: userId }, status: { $ne: "read" } },
    { $set: { status: "read" }, $addToSet: { readBy: userId } }
  );
};

const deleteChat = async (chatId, userId) => {
  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  if (!chat) {
    const err = new Error("Chat not found");
    err.status = 404;
    throw err;
  }
  await Message.deleteMany({ chat: chatId });
  await Chat.findByIdAndDelete(chatId);
};

module.exports = {
  createChat,
  getUserChats,
  sendMessage,
  getChatMessages,
  markMessagesAsRead,
  deleteChat
};
