const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const env = require("./config/env");
const connectDB = require("./database/connectDB");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { applySecurityMiddleware } = require("./middleware/security");
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

// Security and Logging
applySecurityMiddleware(app);
app.use(LoggerService.request);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_ORIGINS,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../../uploads")));
app.use("/legacy-uploads", express.static(path.resolve(__dirname, "routes", "uploads")));

// DB check middleware for all API routes
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

// ─── Routes ───────────────────────────────────────────────────────────────────
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

app.get("/", (req, res) => res.send("FutureMedia API v1 running!"));

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
