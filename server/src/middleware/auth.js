const jwt = require("jsonwebtoken");
const env = require("../config/env");

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      const err = new Error("Authentication token missing");
      err.status = 401;
      return next(err);
    }
    
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    const err = new Error("Invalid or expired token");
    err.status = 401;
    return next(err);
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // optional auth allows unauthenticated access
  }
  next();
};

module.exports = { protect, optionalAuth };
