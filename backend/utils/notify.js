const { Notification } = require("../models");
const { getIo } = require("./socket");

async function notifyUser({ userId, type, message, relatedId = null }) {
  if (!userId || !type || !message) return null;

  const row = await Notification.create({
    userId,
    type,
    message,
    relatedId,
  });

  const io = getIo();
  if (io) {
    io.to(`user:${userId.toString()}`).emit("notification:new", row);
  }

  return row;
}

module.exports = { notifyUser };
