const { Server } = require("socket.io");
const env = require("../config/env");

let io;

const initSocket = (server) => {
  try {
    io = new Server(server, {
      pingTimeout: 60000,
      cors: { origin: env.CLIENT_ORIGINS, credentials: true },
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

    return io;
  } catch (error) {
    console.warn("WARNING: Socket.IO initialization failed. Realtime features disabled.", error.message);
    env.features.socket = false;
    return null;
  }
};

const getIo = () => io;

module.exports = { initSocket, getIo };
