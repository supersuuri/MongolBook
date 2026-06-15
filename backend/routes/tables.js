const router = require("express").Router({ mergeParams: true });
const { Place, Booking } = require("../models");

router.get("/", async (req, res) => {
  try {
    const place = await Place.findById(req.params.placeId).select(
      "tables category",
    );
    if (!place) {
      return res
        .status(404)
        .json({ success: false, message: "Газрын мэдээлэл олдсонгүй" });
    }

    res.json({
      success: true,
      data: place.tables || [],
      meta: { category: place.category },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get("/availability", async (req, res) => {
  try {
    const { placeId } = req.params;
    const { date } = req.query;
    const place = await Place.findById(placeId).select("tables category");
    if (!place) {
      return res
        .status(404)
        .json({ success: false, message: "Газрын мэдээлэл олдсонгүй" });
    }

    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "date шаардлагатай" });
    }

    const from = new Date(date);
    if (Number.isNaN(from.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "date буруу байна" });
    }

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const bookings = await Booking.find({
      placeId,
      tableId: { $ne: null },
      datetime: { $lt: end },
      $or: [{ end: { $gt: start } }, { endDate: { $gt: start } }],
    }).select("tableId");

    const bookedTableIds = [
      ...new Set(
        bookings.map((booking) => booking.tableId?.toString()).filter(Boolean),
      ),
    ];

    res.json({
      success: true,
      data: {
        tables: place.tables || [],
        bookedTableIds,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
