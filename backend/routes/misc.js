const router = require("express").Router();
const { Seat, Schedule, Service } = require("../models/index");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/seats/:businessId
router.get("/:businessId", async (req, res) => {
  try {
    const seats = await Seat.find({ businessId: req.params.businessId }).sort({ row: 1, col: 1 });
    res.json({ success: true, data: seats });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/seats — Суудал нэмэх
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const seat = await Seat.create(req.body);
    res.status(201).json({ success: true, data: seat });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;

// ── Schedules ──────────────────────────────────────────────
const schedRouter = require("express").Router();

schedRouter.get("/:businessId", async (req, res) => {
  try {
    const scheds = await Schedule.find({ businessId: req.params.businessId }).sort("day");
    res.json({ success: true, data: scheds });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

schedRouter.post("/", protect, adminOnly, async (req, res) => {
  try {
    const sched = await Schedule.create(req.body);
    res.status(201).json({ success: true, data: sched });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

module.exports.schedRouter = schedRouter;

// ── Services ───────────────────────────────────────────────
const svcRouter = require("express").Router();

svcRouter.get("/:businessId", async (req, res) => {
  try {
    const services = await Service.find({ businessId: req.params.businessId, isActive: true });
    res.json({ success: true, data: services });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

svcRouter.post("/", protect, adminOnly, async (req, res) => {
  try {
    const svc = await Service.create(req.body);
    res.status(201).json({ success: true, data: svc });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

module.exports.svcRouter = svcRouter;
