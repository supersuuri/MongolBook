require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const { initializeSocket } = require("./utils/socket");
const { Place, Booking } = require("./models/index");
const { protect, adminOnly } = require("./middleware/auth");

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());

// Ширээний захиалга зөвхөн billiard, restaurant-д
const TABLE_CATEGORIES = ["billiard", "restaurant"];

const tableOnly = async (req, res, next) => {
  try {
    const placeId = req.params.placeId || req.params.id || req.body.placeId;
    if (!placeId) {
      return res
        .status(400)
        .json({ success: false, message: "placeId шаардлагатай" });
    }
    const place = await Place.findById(placeId).select("category");
    if (!place) {
      return res
        .status(404)
        .json({ success: false, message: "Газар олдсонгүй" });
    }
    if (!TABLE_CATEGORIES.includes(place.category)) {
      return res.status(403).json({
        success: false,
        message: "Энэ үйлчилгээнд ширээний захиалга байхгүй",
      });
    }
    next();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/places", require("./routes/places"));
app.use("/api/businesses", require("./routes/places"));
app.use("/api/staff", require("./routes/staff"));
app.use("/api/services", require("./routes/services"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/notifications", require("./routes/notifications"));

// Ширээний route — зөвхөн billiard, restaurant
app.use("/api/places/:placeId/tables", tableOnly, require("./routes/tables"));

// Admin stats
app.get("/api/admin/stats", protect, adminOnly, async (req, res) => {
  try {
    const [total, pending, confirmed, cancelled] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "cancelled" }),
    ]);
    res.json({
      success: true,
      data: { total, pending, confirmed, cancelled },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok", time: new Date() }));

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Хаяг олдсонгүй" }),
);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initializeSocket(server);

connectDB().then(() => {
  server.listen(PORT, () =>
    console.log(`🚀 Сервер http://localhost:${PORT} дээр ажиллаж байна`),
  );
});
