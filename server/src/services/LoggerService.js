const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Ensure logs directory exists
const logDir = path.resolve(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// In a real production app, we would use Winston or Pino.
// For now, simple structured logging.

const formatMessage = (level, message, meta = {}) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  }) + "\n";
};

const writeLog = (filename, content) => {
  fs.appendFile(path.join(logDir, filename), content, (err) => {
    if (err) console.error("Failed to write to log file:", err);
  });
};

const redactPayload = (body) => {
  if (!body) return {};
  const redacted = { ...body };
  if (redacted.password) redacted.password = "[REDACTED]";
  if (redacted.token) redacted.token = "[REDACTED]";
  return redacted;
};

const LoggerService = {
  info: (message, meta) => {
    console.log(`[INFO] ${message}`, meta || "");
    writeLog("app.log", formatMessage("INFO", message, meta));
  },
  
  error: (message, error, meta = {}) => {
    console.error(`[ERROR] ${message}`, error);
    writeLog("error.log", formatMessage("ERROR", message, { error: error?.message, stack: error?.stack, ...meta }));
  },

  security: (message, meta) => {
    console.warn(`[SECURITY] ${message}`, meta || "");
    writeLog("security.log", formatMessage("SECURITY", message, meta));
  },

  request: (req, res, next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
    req.id = requestId;
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      const log = formatMessage("REQUEST", `${req.method} ${req.originalUrl} ${res.statusCode}`, {
        requestId,
        ip: req.ip,
        duration: `${duration}ms`,
        userAgent: req.get("User-Agent"),
        body: process.env.NODE_ENV !== "production" && req.body ? redactPayload(req.body) : undefined
      });
      writeLog("request.log", log);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[REQUEST] ${requestId} - ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
      }
    });
    next();
  }
};

module.exports = LoggerService;
