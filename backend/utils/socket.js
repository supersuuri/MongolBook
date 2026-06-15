const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let ioInstance = null;

function initializeSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173"],
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      return next();
    } catch {
      return next();
    }
  });

  ioInstance.on("connection", (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
  });

  return ioInstance;
}

function getIo() {
  return ioInstance;
}

module.exports = { initializeSocket, getIo };
