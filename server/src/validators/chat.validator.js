const validateAccessChat = (req, res, next) => {
  if (!req.body.userId) {
    res.status(400);
    throw new Error("userId is required");
  }
  next();
};

const validateSendMessage = (req, res, next) => {
  if (!req.body.chatId || !req.body.content) {
    res.status(400);
    throw new Error("chatId and content are required");
  }
  next();
};

module.exports = { validateAccessChat, validateSendMessage };
