const mongoose = require("mongoose");
const env = require("../config/env");

let mongoConnectPromise = null;

const connectDB = async () => {
  try {
    const mongoUri = env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI not defined in .env file");
    if (mongoose.connection.readyState === 1) return;

    if (!mongoConnectPromise) {
      mongoConnectPromise = mongoose
        .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
        .then(() => console.log("MongoDB Atlas connected successfully!!"))
        .catch(async (err) => {
          console.log("MongoDB connection failed:", err.message);
          console.log("Falling back to in-memory MongoDB...");
          try {
            const { MongoMemoryServer } = require("mongodb-memory-server");
            const mongoServer = await MongoMemoryServer.create();
            await mongoose.connect(mongoServer.getUri());
            console.log("In-memory MongoDB connected.");
          } catch (memErr) {
            console.error("In-memory fallback failed:", memErr.message);
          }
        })
        .finally(() => { mongoConnectPromise = null; });
    }
    await mongoConnectPromise;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
};

module.exports = connectDB;
