const express = require("express");
const { protect } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const {
  createChat,
  getUserChats,
  sendMessage,
  getChatMessages,
  markAsRead
} = require("../controllers/chatController");

const router = express.Router();

router.post("/access", protect, createChat);
router.get("/", protect, getUserChats);

router.post("/message", protect, upload.any(), sendMessage);
router.get("/messages/:chatId", protect, getChatMessages);
router.put("/:chatId/read", protect, markAsRead);
router.delete("/:chatId", protect, require("../controllers/chatController").deleteChat);

module.exports = router;
