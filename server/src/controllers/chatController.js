const chatService = require("../services/chat.service");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/responseHandler");

exports.createChat = asyncHandler(async (req, res) => {
  const result = await chatService.createChat(req.user.id, req.body.userId);
  return successResponse(res, 201, "Chat initialized", result);
});

exports.getUserChats = asyncHandler(async (req, res) => {
  const result = await chatService.getUserChats(req.user.id);
  return successResponse(res, 200, "Chats fetched", result);
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  let attachments = req.body.attachments || [];
  
  if (req.files && req.files.length > 0) {
    const fileAttachments = req.files.map(file => ({
      url: file.path && file.path.startsWith("http") ? file.path : `/uploads/${file.filename}`,
      type: file.mimetype.startsWith('video') ? 'video' : file.mimetype.startsWith('audio') ? 'audio' : 'image',
      provider: file.path && file.path.startsWith("http") ? "cloudinary" : "local"
    }));
    attachments = [...attachments, ...fileAttachments];
  }

  const result = await chatService.sendMessage(req.user.id, chatId, content, attachments);
  return successResponse(res, 201, "Message sent", result);
});

exports.getChatMessages = asyncHandler(async (req, res) => {
  const result = await chatService.getChatMessages(req.params.chatId);
  return successResponse(res, 200, "Messages fetched", result);
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await chatService.markMessagesAsRead(req.params.chatId, req.user.id);
  return successResponse(res, 200, "Messages marked as read", null);
});

exports.deleteChat = asyncHandler(async (req, res) => {
  await chatService.deleteChat(req.params.chatId, req.user.id);
  return successResponse(res, 200, "Chat deleted", null);
});
