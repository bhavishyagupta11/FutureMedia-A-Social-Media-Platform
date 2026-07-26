const http = require("http");
const app = require("./app");
const env = require("./config/env");
const connectDB = require("./database/connectDB");
const { initSocket } = require("./sockets/socket");

const server = http.createServer(app);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    initSocket(server);

    server.listen(env.PORT, () => {
      console.log(`
=============================
FutureMedia Startup Summary
=============================
MongoDB ✓
JWT ✓
Redis ${env.features.redis ? '✓' : '⚠ Disabled'}
BullMQ ${env.features.bullmq ? '✓' : '⚠ Disabled'}
SMTP ${env.features.smtp ? '✓' : '⚠ Disabled'}
Cloudinary ${env.features.cloudinary ? '✓' : '✓ Local Storage Mode'}
Socket.IO ${env.features.socket ? '✓' : '⚠ Disabled'}
FastAPI ${env.features.intelligence ? '✓' : '⚠ Disabled'}

Application Mode: Development
Authentication: READY
=============================
      `);
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
