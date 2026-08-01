const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, logout, logoutAll, forgotPassword, resetPassword, verifyEmail, resendVerification } = require("../controllers/authController");
const { validateRegister, validateLogin } = require("../validators/auth.validator");
const { protect } = require("../middleware/auth");

const router = express.Router();

const isTestEnv = process.env.NODE_ENV === "test" || process.env.PLAYWRIGHT_TEST === "true";

// Rate limiter for resend verification (5 per hour in prod, 100 in test)
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTestEnv ? 100 : 5,
  message: {
    success: false,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many resend requests. Please try again after an hour."
  }
});

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", protect, logout);
router.post("/logout-all", protect, logoutAll);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendLimiter, resendVerification);

module.exports = router;
