const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const env = require("./config/env");
const connectDB = require("./database/connectDB");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { applySecurityMiddleware, applySanitizationMiddleware } = require("./middleware/security");
const LoggerService = require("./services/LoggerService");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const chatRoutes = require("./routes/chatRoutes");
const feedRoutes = require("./routes/feedRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const storyRoutes = require("./routes/storyRoutes");
const { getHealth } = require("./controllers/healthController");

const app = express();

// ─── 1. Reverse Proxy Trust Configuration (REQUIRED FOR RENDER / VERCEL) ─────
// Must be configured immediately after express() initialization before rate limiters or security middleware
app.set("trust proxy", 1);

// ─── 2. Security and Structured Request Logging ─────────────────────────────
applySecurityMiddleware(app);
app.use(LoggerService.request);

// ─── 3. Production CORS Configuration ───────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, cURL, or server-to-server)
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.trim().replace(/\/+$/, "");
    if (env.CLIENT_ORIGINS.includes(normalizedOrigin) || env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
applySanitizationMiddleware(app);

app.use("/uploads", express.static(path.resolve(__dirname, "../../uploads")));
app.use("/legacy-uploads", express.static(path.resolve(__dirname, "routes", "uploads")));

// ─── 4. Database Readiness Middleware ───────────────────────────────────────
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    connectDB().then(() => {
      if (mongoose.connection.readyState === 1) {
        next();
      } else {
        return res.status(503).json({
          error: "Database unavailable",
          message: "Server is running but database is not ready.",
        });
      }
    });
  } else {
    next();
  }
});

// ─── 5. API Routes ──────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/feed", feedRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/stories", storyRoutes);

app.get("/api/v1/health", getHealth);
app.get("/api/v1/ready", getHealth);
app.get("/api/v1/live", getHealth);

app.get("/", (req, res) => res.send("FutureMedia Production API v1 running!"));

// ─── 6. Global Error Handlers ───────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
