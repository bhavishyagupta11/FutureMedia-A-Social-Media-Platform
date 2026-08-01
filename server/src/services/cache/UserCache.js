const redis = require("./redisClient");
const USER_PREFIX = "user:";

exports.getUser = async (id) => {
  const data = await redis.get(USER_PREFIX + id);
  return data ? JSON.parse(data) : null;
};

exports.setUser = async (id, data, ttl = 3600) => {
  await redis.set(USER_PREFIX + id, JSON.stringify(data), "EX", ttl);
};