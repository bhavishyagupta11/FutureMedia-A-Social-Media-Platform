const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const applySecurityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  const isTestEnv = process.env.NODE_ENV === "test" || process.env.PLAYWRIGHT_TEST === "true";

  // Production-safe global rate limiter behind reverse proxy
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isTestEnv ? 50000 : 1000, // Limit each IP to 1000 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later."
    }
  });
  app.use("/api", limiter);

  // Stricter rate limit for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isTestEnv ? 50000 : 100, // Allow 100 login/register attempts per hour in production
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many authentication attempts from this IP, please try again after an hour."
    }
  });

  // Apply to versioned and legacy auth routes
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/register", authLimiter);
  app.use("/api/v1/auth/forgot-password", authLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
};

const applySanitizationMiddleware = (app) => {
  // Applied after body-parser to safely sanitize req.body, req.params without mutating query getter
  app.use((req, res, next) => {
    if (req.body && typeof req.body === "object") {
      mongoSanitize.sanitize(req.body, { replaceWith: "_" });
    }
    if (req.params && typeof req.params === "object") {
      mongoSanitize.sanitize(req.params, { replaceWith: "_" });
    }
    next();
  });
};

module.exports = { applySecurityMiddleware, applySanitizationMiddleware };
