const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

const clientOrigins = (
  process.env.CLIENT_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  pingTimeout: 60000,
  cors: { origin: clientOrigins, credentials: true },
});

io.on("connection", (socket) => {
  socket.on("setup", (userData) => {
    socket.join(userData._id || userData.id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessage) => {
    const chat = newMessage.chat;
    if (!chat || !chat.participants) return;

    chat.participants.forEach((user) => {
      const uid = user._id || user;
      if (uid.toString() === newMessage.sender._id.toString()) return;
      socket.in(uid.toString()).emit("message received", newMessage);
    });
  });

  socket.on("disconnect", () => {
    // cleanup if needed
  });
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
let mongoConnectPromise = null;

const connectToMongo = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
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

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.includes(origin)) return callback(null, true);
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

// DB check middleware for all API routes
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    connectToMongo().then(() => {
      if (mongoose.connection.readyState === 1) {
        next();
      } else {
        return res.status(503).json({
          error: "Database unavailable",
          message: "Server is running but database is not ready.",
        });
      }
    });
  } else {
    next();
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => res.send("Future Media - A Social Media Platform API running!"));

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await connectToMongo();
});
