const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Ensure logs directory exists
const logDir = path.resolve(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (e) {
    // Fallback if log directory creation fails on read-only server filesystem
  }
}

const formatMessage = (level, message, meta = {}) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  }) + "\n";
};

const writeLog = (filename, content) => {
  const targetPath = path.join(logDir, filename);
  fs.appendFile(targetPath, content, (err) => {
    // Ignore file write errors on cloud hosts with ephemeral filesystems
  });
};

const redactPayload = (body) => {
  if (!body || typeof body !== "object") return {};
  const redacted = { ...body };
  if (redacted.password) redacted.password = "[REDACTED]";
  if (redacted.token) redacted.token = "[REDACTED]";
  if (redacted.currentPassword) redacted.currentPassword = "[REDACTED]";
  if (redacted.newPassword) redacted.newPassword = "[REDACTED]";
  return redacted;
};

const LoggerService = {
  info: (message, meta) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : "");
    writeLog("app.log", formatMessage("INFO", message, meta));
  },
  
  error: (message, error, meta = {}) => {
    console.error(`[ERROR] ${message}`, error?.stack || error?.message || error || "");
    writeLog("error.log", formatMessage("ERROR", message, { error: error?.message, stack: error?.stack, ...meta }));
  },

  security: (message, meta) => {
    console.warn(`[SECURITY] ${message}`, meta ? JSON.stringify(meta) : "");
    writeLog("security.log", formatMessage("SECURITY", message, meta));
  },

  request: (req, res, next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
    req.id = requestId;
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      const meta = {
        requestId,
        ip: req.ip,
        duration: `${duration}ms`,
        userAgent: req.get("User-Agent"),
        body: req.body ? redactPayload(req.body) : undefined
      };
      
      const logStr = formatMessage("REQUEST", `${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
      writeLog("request.log", logStr);

      // Always print structured request log to console for cloud platforms (Render, Heroku, Railway)
      console.log(`[REQUEST] ${requestId} | ${req.ip || "unknown-ip"} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms`);
    });
    next();
  }
};

module.exports = LoggerService;
