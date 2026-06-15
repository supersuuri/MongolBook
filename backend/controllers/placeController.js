const { Place, Service, Staff, Booking } = require("../models");
const { ownerOrAdmin } = require("../middleware/auth");

const TABLE_BASED_CATEGORIES = new Set(["billiard", "restaurant"]);

function normalizeTablesByCategory(category, tables) {
  if (!TABLE_BASED_CATEGORIES.has(category)) return [];
  return Array.isArray(tables) ? tables : [];
}

function buildFilter(query = {}) {
  const filter = { isActive: true };
  if (query.category && query.category !== "all")
    filter.category = query.category;
  if (query.search) filter.name = { $regex: query.search, $options: "i" };
  return filter;
}

exports.listPlaces = async (req, res) => {
  try {
    // do not expose table configurations in list view
    const places = await Place.find(buildFilter(req.query))
      .select("-tables")
      .sort({ rating: -1, createdAt: -1 });
    res.json({ success: true, data: places });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getNearbyPlaces = async (req, res) => {
  try {
    const { lat, lng, radius = 5, category } = req.query;
    if (!lat || !lng) {
      return res
        .status(400)
        .json({ success: false, message: "lat, lng шаардлагатай" });
    }
    let data = await Place.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius),
    );
    // strip tables from nearby results for privacy/control
    data = data.map((p) => {
      const { tables, ...rest } = p;
      return rest;
    });
    if (category && category !== "all") {
      data = data.filter((p) => p.category === category);
    }
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getPlaceById = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id).populate(
      "ownerId",
      "name email phone",
    );
    if (!place)
      return res
        .status(404)
        .json({ success: false, message: "Газрын мэдээлэл олдсонгүй" });

    const [services, staffs, bookings] = await Promise.all([
      Service.find({ placeId: place._id, isActive: true }).sort({
        createdAt: -1,
      }),
      Staff.find({ placeId: place._id, isActive: true }).sort({
        createdAt: -1,
      }),
      Booking.find({
        placeId: place._id,
        status: { $in: ["pending", "confirmed"] },
      })
        .select("datetime tableId staffId status")
        .sort({ datetime: 1 })
        .limit(150),
    ]);

    res.json({
      success: true,
      data: {
        ...place.toObject(),
        services,
        staffs,
        activeBookings: bookings,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getMyPlaces = async (req, res) => {
  try {
    const filter = { ownerId: req.user._id };
    const places = await Place.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: places });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createPlace = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Зөвхөн тухайн газрын админ газар бүртгэнэ",
      });
    }

    const payload = { ...req.body };
    payload.ownerId = req.user._id;
    payload.tables = normalizeTablesByCategory(
      payload.category,
      payload.tables,
    );

    const place = await Place.create(payload);
    res.status(201).json({ success: true, data: place });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updatePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place)
      return res
        .status(404)
        .json({ success: false, message: "Газрын мэдээлэл олдсонгүй" });

    if (!ownerOrAdmin(place.ownerId, req.user)) {
      return res
        .status(403)
        .json({ success: false, message: "Зөвшөөрөл байхгүй" });
    }

    const updatePayload = { ...req.body };
    const nextCategory = updatePayload.category || place.category;

    if (!TABLE_BASED_CATEGORIES.has(nextCategory)) {
      updatePayload.tables = [];
    } else if (Object.prototype.hasOwnProperty.call(updatePayload, "tables")) {
      updatePayload.tables = Array.isArray(updatePayload.tables)
        ? updatePayload.tables
        : [];
    }

    const next = await Place.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: next });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deletePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place)
      return res
        .status(404)
        .json({ success: false, message: "Газрын мэдээлэл олдсонгүй" });

    if (!ownerOrAdmin(place.ownerId, req.user)) {
      return res
        .status(403)
        .json({ success: false, message: "Зөвшөөрөл байхгүй" });
    }

    await Promise.all([
      Service.deleteMany({ placeId: place._id }),
      Staff.deleteMany({ placeId: place._id }),
      Booking.deleteMany({ placeId: place._id }),
      Place.findByIdAndDelete(place._id),
    ]);

    res.json({ success: true, message: "Амжилттай устгалаа" });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
