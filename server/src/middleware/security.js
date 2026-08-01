const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const applySecurityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 1000, // Limit each IP to 1000 requests per `window`
    message: "Too many requests from this IP, please try again later"
  });
  app.use("/api", limiter);

  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true';

  // Stricter rate limit for auth routes
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isTestEnv ? 10000 : 50,
    message: "Too many login attempts, please try again after an hour"
  });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
};

module.exports = { applySecurityMiddleware };
