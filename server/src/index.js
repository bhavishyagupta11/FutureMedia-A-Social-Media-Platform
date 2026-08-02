const http = require("http");
const app = require("./app");
const env = require("./config/env");
const connectDB = require("./database/connectDB");
const { initSocket } = require("./sockets/socket");

// ─── 1. Global Process Telemetry & Exception Tracking ───────────────────────
process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught Exception during runtime:", error.stack || error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Promise Rejection at:", promise, "Reason:", reason);
});

// ─── 2. HTTP Server & Socket.IO Instantiation ────────────────────────────────
const server = http.createServer(app);

// Synchronously initialize Socket.IO on HTTP server instance
initSocket(server);

// ─── 3. Immediate Port Binding for Render & Cloud Platforms ────────────────
// Must bind to process.env.PORT on host 0.0.0.0 immediately without blocking on DB I/O
const PORT = process.env.PORT || env.PORT || 8080;
const HOST = "0.0.0.0";

const modeDisplay = env.isProduction ? "Production" : "Development";

server.listen(PORT, HOST, () => {
  console.log(`
=============================
FutureMedia Startup Summary
=============================
MongoDB status: Connecting...
JWT ✓
Redis ${env.features.redis ? '✓' : '⚠ Disabled'}
BullMQ ${env.features.bullmq ? '✓' : '⚠ Disabled'}
SMTP ${env.features.smtp ? '✓' : '⚠ Disabled'}
Cloudinary ${env.features.cloudinary ? '✓' : '✓ Local Storage Mode'}
Socket.IO ${env.features.socket ? '✓' : '⚠ Disabled'}
FastAPI ${env.features.intelligence ? '✓' : '⚠ Disabled'}

Application Mode: ${modeDisplay}
Authentication: READY
Port Binding: 0.0.0.0:${PORT} ✓
=============================
Server running on http://${HOST}:${PORT} in ${modeDisplay} mode
`);

  // Asynchronous, non-blocking database connection in background
  connectDB()
    .then(() => console.log("[STARTUP] Background database connection pipeline completed."))
    .catch((err) => console.error("[STARTUP] Background database connection error:", err.message));
});

// ─── 4. Graceful Shutdown Handlers ───────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`[SHUTDOWN] Received ${signal}. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log("[SHUTDOWN] HTTP server closed cleanly. Exiting process.");
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error("[SHUTDOWN] Forced exit after 10s shutdown timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = server;
