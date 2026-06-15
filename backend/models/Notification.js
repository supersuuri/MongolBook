const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["booking", "payment", "review", "system"],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
