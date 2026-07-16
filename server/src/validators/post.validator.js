const validateComment = (req, res, next) => {
  if (!req.body.text) {
    res.status(400);
    throw new Error("Comment text is required");
  }
  next();
};

module.exports = { validateComment };
