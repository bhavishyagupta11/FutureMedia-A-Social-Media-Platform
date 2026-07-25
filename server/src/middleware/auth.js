const jwt = require("jsonwebtoken");
const env = require("../config/env");

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      res.status(401);
      throw new Error("Authentication token missing");
    }
    
    const decoded = jwt.verify(token, env.JWT_SECRET || "default_secret");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired token");
  }
};

module.exports = { protect };
