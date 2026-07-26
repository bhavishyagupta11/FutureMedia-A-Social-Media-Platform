const Redis = require("ioredis");
const env = require("../../config/env");

let redis = null;

if (env.features.redis) {
  redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      if (times > 3) {
        console.warn("WARNING:\nRedis unavailable.\nRunning without cache.");
        env.features.redis = false;
        env.features.bullmq = false; // Disable BullMQ if Redis fails
        return null; // Stop retrying
      }
      return Math.min(times * 50, 2000);
    }
  });

  redis.on("error", (error) => {
    // Silence errors to prevent crashes if Redis is offline
  });

  redis.connect().catch(() => {
    console.warn("WARNING:\nRedis unavailable.\nRunning without cache.");
    env.features.redis = false;
    env.features.bullmq = false;
  });
} else {
  console.warn("WARNING:\nRedis disabled.\nRunning without cache.");
}

module.exports = redis;