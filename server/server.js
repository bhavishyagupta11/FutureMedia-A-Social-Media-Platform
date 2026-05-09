const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");

const app = express();
const PORT = process.env.PORT || 8080;
const clientOrigins = (
  process.env.CLIENT_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
let mongoConnectPromise = null;

// Connect to MongoDB Atlas
const connectToMongo = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error("MONGO_URI not defined in .env file");
    }
    
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if (!mongoConnectPromise) {
      mongoConnectPromise = mongoose
        .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
        .then(() => {
          console.log("MongoDB Atlas connected successfully!!");
        })
        .catch(async (err) => {
          console.log("MongoDB connection failed:", err.message);
          console.log("Falling back to in-memory MongoDB...");
          try {
            const { MongoMemoryServer } = require("mongodb-memory-server");
            const mongoServer = await MongoMemoryServer.create();
            const memUri = mongoServer.getUri();
            await mongoose.connect(memUri);
            console.log("In-memory MongoDB started and connected successfully on", memUri);
          } catch (memErr) {
            console.error("In-memory fallback failed:", memErr.message);
          }
        })
        .finally(() => {
          mongoConnectPromise = null;
        });
    }

    await mongoConnectPromise;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));
app.use("/legacy-uploads", express.static(path.resolve(__dirname, "routes", "uploads")));

app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    // Try to connect if not connected
    connectToMongo().then(() => {
      if (mongoose.connection.readyState === 1) {
        next();
      } else {
        return res.status(503).json({
          error: "Database unavailable",
          message: "Server is running, but database connection is not ready.",
        });
      }
    });
  } else {
    next();
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await connectToMongo();
});
