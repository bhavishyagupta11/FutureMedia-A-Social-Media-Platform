const fs = require('fs');
const path = require('path');

const serverDir = path.join(__dirname, 'server', 'src');

const cacheDir = path.join(serverDir, 'services', 'cache');
const workersDir = path.join(serverDir, 'workers');

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
if (!fs.existsSync(workersDir)) fs.mkdirSync(workersDir, { recursive: true });

const redisClient = `const Redis = require("ioredis");\nconst env = require("../../config/env");\nconst redis = new Redis(env.REDIS_URL || "redis://127.0.0.1:6379");\nmodule.exports = redis;`;
fs.writeFileSync(path.join(cacheDir, 'redisClient.js'), redisClient);

const userCache = `const redis = require("./redisClient");\nconst USER_PREFIX = "user:";\n\nexports.getUser = async (id) => {\n  const data = await redis.get(USER_PREFIX + id);\n  return data ? JSON.parse(data) : null;\n};\n\nexports.setUser = async (id, data, ttl = 3600) => {\n  await redis.set(USER_PREFIX + id, JSON.stringify(data), "EX", ttl);\n};`;
fs.writeFileSync(path.join(cacheDir, 'UserCache.js'), userCache);

const emailQueue = `const { Queue, Worker } = require("bullmq");\nconst redis = require("../services/cache/redisClient");\n\nconst emailQueue = new Queue("EmailQueue", { connection: redis });\n\nconst emailWorker = new Worker("EmailQueue", async job => {\n  console.log("Sending email to:", job.data.to);\n  // Nodemailer logic here\n}, { connection: redis });\n\nmodule.exports = { emailQueue };`;
fs.writeFileSync(path.join(workersDir, 'EmailQueue.js'), emailQueue);

// Health controller
const healthController = `exports.getHealth = (req, res) => res.json({ success: true, message: "Healthy", data: { status: "OK", version: "1.0.0" }, errors: null });`;
fs.writeFileSync(path.join(serverDir, 'controllers', 'healthController.js'), healthController);

console.log('Redis Cache, BullMQ Workers, and Health Endpoints scaffolded.');
