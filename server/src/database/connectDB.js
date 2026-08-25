const mongoose = require("mongoose");
const env = require("../config/env");
const seedDatabase = require("./seedDatabase");

let mongoConnectPromise = null;

const connectDB = async () => {
  try {
    const mongoUri = env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI not defined in environment variables");
    if (mongoose.connection.readyState === 1) {
      if (process.env.NODE_ENV !== "test") {
        await seedDatabase();
      }
      return;
    }

    if (!mongoConnectPromise) {
      mongoConnectPromise = mongoose
        .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
        .then(async () => {
          console.log("[DATABASE] MongoDB connected successfully!");
          if (process.env.NODE_ENV !== "test") {
            await seedDatabase();
          }
        })
        .catch(async (err) => {
          console.error("[DATABASE] MongoDB connection attempt failed:", err.message);
          
          // Never attempt to spin up in-memory MongoDB in production
          if (!env.isProduction && process.env.NODE_ENV !== "production") {
            console.log("[DATABASE] Development mode detected: attempting in-memory fallback...");
            try {
              const { MongoMemoryServer } = require("mongodb-memory-server");
              const mongoServer = await MongoMemoryServer.create();
              await mongoose.connect(mongoServer.getUri());
              console.log("[DATABASE] In-memory MongoDB connected successfully.");
              if (process.env.NODE_ENV !== "test") {
                await seedDatabase();
              }
            } catch (memErr) {
              console.error("[DATABASE] In-memory fallback failed:", memErr.message);
            }
          }
        })
        .finally(() => { 
          mongoConnectPromise = null; 
        });
    }
    await mongoConnectPromise;
  } catch (err) {
    console.error("[DATABASE] Non-fatal MongoDB connection error:", err.message);
  }
};

module.exports = connectDB;
