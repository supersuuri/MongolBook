const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

serviceSchema.index({ placeId: 1, isActive: 1 });

module.exports = mongoose.model("Service", serviceSchema);
