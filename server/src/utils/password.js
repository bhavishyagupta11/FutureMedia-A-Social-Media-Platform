const crypto = require("crypto");

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const HASH_ALGO = "sha512";

const hashPassword = (plainTextPassword) => {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = crypto
    .scryptSync(plainTextPassword, salt, KEY_LENGTH, { N: 16384, r: 8, p: 1 })
    .toString("hex");

  return `scrypt$${HASH_ALGO}$${salt}$${derivedKey}`;
};

const verifyPassword = (plainTextPassword, storedPassword) => {
  if (!storedPassword || typeof storedPassword !== "string") {
    return false;
  }

  if (!storedPassword.startsWith("scrypt$")) {
    return plainTextPassword === storedPassword;
  }

  const parts = storedPassword.split("$");
  if (parts.length !== 4) {
    return false;
  }

  const [, algo, salt, hash] = parts;
  if (algo !== HASH_ALGO) {
    return false;
  }

  const derivedKey = crypto
    .scryptSync(plainTextPassword, salt, KEY_LENGTH, { N: 16384, r: 8, p: 1 })
    .toString("hex");
  const derivedBuffer = Buffer.from(derivedKey, "hex");
  const hashBuffer = Buffer.from(hash, "hex");

  if (derivedBuffer.length !== hashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedBuffer, hashBuffer);
};

const needsPasswordUpgrade = (storedPassword) =>
  typeof storedPassword === "string" && !storedPassword.startsWith("scrypt$");

module.exports = {
  hashPassword,
  verifyPassword,
  needsPasswordUpgrade,
};
