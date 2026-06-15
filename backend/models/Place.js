const mongoose = require("mongoose");

const tableConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["regular", "vip", "hall", "room"],
      default: "regular",
    },
    row: { type: String, default: "A" },
    col: { type: Number, default: 1 },
    capacity: { type: Number, default: 2 },
    // price per default booking unit (e.g., per hour) in tugrik
    price: { type: Number, default: 0 },
    // how many guests this table is suitable for
    minGuests: { type: Number, default: 1 },
    maxGuests: { type: Number, default: 4 },
    // optional equipment / features (e.g., cues included, projector)
    features: [{ type: String }],
    // optional image for the table/room
    image: { type: String, default: "" },
    // whether this table is currently available for booking
    isActive: { type: Boolean, default: true },
    // optional notes / display label
    notes: { type: String, default: "" },
  },
  { _id: true },
);

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["salon", "barber", "beauty", "billiard", "restaurant", "resort"],
      required: true,
    },
    description: { type: String, default: "" },
    address: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    phone: { type: String, default: "" },
    images: [{ type: String }],
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    tables: [tableConfigSchema],
  },
  { timestamps: true },
);

placeSchema.index({ ownerId: 1 });
placeSchema.index({ category: 1, isActive: 1 });

placeSchema.statics.findNearby = async function findNearby(
  lat,
  lng,
  radiusKm = 5,
) {
  const earthRadiusKm = 6371;
  const places = await this.find({ isActive: true });

  return places
    .map((p) => {
      const dLat = ((p.location.lat - lat) * Math.PI) / 180;
      const dLng = ((p.location.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((p.location.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const dist =
        earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...p.toObject(), distance: Math.round(dist * 10) / 10 };
    })
    .filter((p) => p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

module.exports = mongoose.model("Place", placeSchema);
