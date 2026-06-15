const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
      required: true,
    },
    name: { type: String, required: true },
    profileImage: { type: String, default: "" },
    role: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    // Optional working hours: array of { day: 0-6, start: '09:00', end: '18:00' }
    workingHours: {
      type: [
        {
          day: { type: Number },
          start: { type: String },
          end: { type: String },
        },
      ],
      default: [],
    },
    // Buffer minutes between appointments
    bufferMinutes: { type: Number, default: 10 },
  },
  { timestamps: true },
);

staffSchema.index({ placeId: 1, isActive: 1 });

module.exports = mongoose.model("Staff", staffSchema);
