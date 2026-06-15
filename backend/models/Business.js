const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: "" },
  address:     { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  category:    { type: String, enum: ["hairsalon", "beauty", "billiard", "cafe", "fitness", "other"], default: "other" },
  phone:       { type: String },
  images:      [{ type: String }],
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

// Ойролцоох байгууллага хайх (Haversine)
businessSchema.statics.findNearby = async function (lat, lng, radiusKm = 5) {
  const R = 6371;
  const all = await this.find({ isActive: true });
  return all
    .map(b => {
      const dLat = ((b.location.lat - lat) * Math.PI) / 180;
      const dLng = ((b.location.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
        Math.cos((b.location.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...b.toObject(), distance: Math.round(dist * 10) / 10 };
    })
    .filter(b => b.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

module.exports = mongoose.model("Business", businessSchema);
