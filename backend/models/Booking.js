const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    tableId: { type: mongoose.Schema.Types.ObjectId, default: null },
    tableType: {
      type: String,
      enum: ["regular", "vip", "hall", "room", null],
      default: null,
    },
    // For overnight/day-based bookings (resorts)
    isOvernight: { type: Boolean, default: false },
    endDate: { type: Date, default: null },
    nights: { type: Number, default: 0 },
    // Time-based booking end and duration
    end: { type: Date, default: null },
    durationMinutes: { type: Number, default: 0 },
    datetime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    note: { type: String, default: "" },
    totalPrice: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, default: "" },
    confirmedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bookingSchema.index({ placeId: 1, datetime: 1, status: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
