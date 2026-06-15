const router = require("express").Router();
const Business = require("../models/Business");
const { Service, Schedule, Seat } = require("../models/index");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/businesses — Бүгдийг авах
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };
    if (category && category !== "all") filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };
    const businesses = await Business.find(filter).sort({ rating: -1 });
    res.json({ success: true, data: businesses });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/businesses/nearby — Haversine ойролцоох хайлт
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: "lat, lng шаардлагатай" });
    const nearby = await Business.findNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    res.json({ success: true, data: nearby });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/businesses/:id — Дэлгэрэнгүй
router.get("/:id", async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, message: "Байгууллага олдсонгүй" });
    const [services, schedules, seats] = await Promise.all([
      Service.find({ businessId: req.params.id, isActive: true }),
      Schedule.find({ businessId: req.params.id }).sort("day"),
      Seat.find({ businessId: req.params.id }),
    ]);
    res.json({ success: true, data: { ...business.toObject(), services, schedules, seats } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/businesses — Шинэ байгууллага (admin)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const business = await Business.create({ ...req.body, ownerId: req.user._id });
    res.status(201).json({ success: true, data: business });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// PUT /api/businesses/:id
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const b = await Business.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: b });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
