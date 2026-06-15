const { Notification } = require("../models");

exports.listNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const data = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({ success: true, data, unreadCount });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const row = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true },
    );

    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Мэдэгдэл олдсонгүй" });
    }

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true },
    );

    res.json({ success: true, message: "Бүх мэдэгдлийг уншсанд тэмдэглэлээ" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
