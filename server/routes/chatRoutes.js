const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const auth = require("../middleware/auth");

router.post("/access", auth, chatController.accessChat);
router.get("/", auth, chatController.fetchChats);
router.post("/message", auth, chatController.sendMessage);
router.get("/messages/:chatId", auth, chatController.getMessages);

module.exports = router;
