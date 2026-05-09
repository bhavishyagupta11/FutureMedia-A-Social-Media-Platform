const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");

// Access or create a 1-on-1 chat between logged-in user and another user
exports.accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, userId], $size: 2 },
    })
      .populate("participants", "username displayName profilePicture")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username displayName profilePicture" },
      });

    if (!chat) {
      chat = await Chat.create({ participants: [req.user.id, userId] });
      chat = await Chat.findById(chat._id).populate(
        "participants",
        "username displayName profilePicture"
      );
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error accessing chat" });
  }
};

// Get all chats for logged-in user
exports.fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate("participants", "username displayName profilePicture")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username displayName profilePicture" },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching chats" });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  const { chatId, content } = req.body;

  if (!chatId || !content) {
    return res.status(400).json({ error: "chatId and content are required" });
  }

  try {
    let message = await Message.create({
      sender: req.user.id,
      content,
      chat: chatId,
    });

    message = await Message.findById(message._id)
      .populate("sender", "username displayName profilePicture")
      .populate({ path: "chat", populate: { path: "participants", select: "username displayName profilePicture" } });

    // Update latestMessage on the chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error sending message" });
  }
};

// Get all messages in a chat
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username displayName profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching messages" });
  }
};
