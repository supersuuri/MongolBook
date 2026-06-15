const mongoose = require("mongoose");
const { Booking, Place, Service, Staff } = require("../models");
const { ownerOrAdmin } = require("../middleware/auth");
const { notifyUser } = require("../utils/notify");
const { getIo } = require("../utils/socket");

const ACTIVE_STATUSES = ["pending", "confirmed"];
const STAFF_CATEGORIES = ["barber", "beauty", "salon"];
const TABLE_CATEGORIES = ["billiard", "restaurant", "resort"];

function getSlots(windowStart, windowEnd, stepMinutes = 30) {
  // Generate candidate starts inside a working window using the requested step
  const step = Math.max(1, Number(stepMinutes) || 30);
  const result = [];
  const current = new Date(windowStart);

  while (current.getTime() + step * 60000 <= windowEnd.getTime()) {
    result.push(current.toTimeString().slice(0, 5));
    current.setMinutes(current.getMinutes() + step);
  }

  return result;
}

function parseTimeToDate(date, hhmm) {
  const [hh, mm] = String(hhmm).split(":").map(Number);
  const d = new Date(date);
  d.setHours(hh, mm || 0, 0, 0);
  return d;
}

function getWorkingWindow(date, staff) {
  const base = new Date(date);
  const defaultStart = parseTimeToDate(base, "09:00");
  const defaultEnd = parseTimeToDate(base, "21:00");

  if (staff?.workingHours?.length) {
    const day = base.getDay();
    const wh = staff.workingHours.find((item) => item.day === day);
    if (wh?.start && wh?.end) {
      return {
        start: parseTimeToDate(base, wh.start),
        end: parseTimeToDate(base, wh.end),
      };
    }
  }

  return { start: defaultStart, end: defaultEnd };
}

function getBookingSpanMinutes(service, staff) {
  const duration = Math.max(1, Number(service?.duration) || 30);
  const buffer = Math.max(0, Number(staff?.bufferMinutes) || 0);
  return { duration, buffer, span: duration + buffer };
}

function getBookingEnd(booking, fallbackMinutes) {
  return (
    booking.end ||
    booking.endDate ||
    new Date(new Date(booking.datetime).getTime() + fallbackMinutes * 60000)
  );
}

function overlapQuery(start, end) {
  return {
    status: { $in: ACTIVE_STATUSES },
    datetime: { $lt: end },
    end: { $gt: start },
  };
}

function dayRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function validateTargetByCategory(place, payload) {
  const category = place.category;
  if (STAFF_CATEGORIES.includes(category)) {
    if (!payload.staffId) return "Энэ төрлийн газар ажилтан заавал сонгоно";
  }
  if (TABLE_CATEGORIES.includes(category)) {
    if (!payload.tableId) return "Энэ төрлийн газар ширээ заавал сонгоно";
  }
  return null;
}

async function assertOwnerAccess(placeId, user) {
  const place = await Place.findById(placeId).select("ownerId");
  if (!place) return { place: null, allowed: false };
  return { place, allowed: ownerOrAdmin(place.ownerId, user) };
}

async function refreshPlaceRating(placeId) {
  const stats = await Booking.aggregate([
    {
      $match: {
        placeId,
        status: "completed",
        rating: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$placeId",
        rating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const next = stats[0];
  if (!next) return;
  const place = await Place.findById(placeId).select("rating reviewCount");
  const existingCount = place?.reviewCount || 0;
  const existingRating = place?.rating || 0;
  const totalCount = existingCount + (next.reviewCount || 0);
  const weightedRating =
    totalCount === 0
      ? 0
      : (existingRating * existingCount +
          next.rating * (next.reviewCount || 0)) /
        totalCount;

  await Place.findByIdAndUpdate(placeId, {
    rating: Math.round(weightedRating * 10) / 10,
    reviewCount: totalCount,
  });
}

async function safeNotify(payload) {
  try {
    await notifyUser(payload);
  } catch (e) {
    console.error("Notification error:", e.message);
  }
}

exports.listMyBookings = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status && req.query.status !== "all")
      filter.status = req.query.status;

    const data = await Booking.find(filter)
      .populate("placeId", "name category address images")
      .populate("serviceId", "name duration price")
      .populate("staffId", "name role profileImage")
      .sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listAdminBookings = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Зөвхөн тухайн газрын админ хандах боломжтой",
      });
    }

    const filter = {};
    if (req.query.placeId) {
      const access = await assertOwnerAccess(req.query.placeId, req.user);
      if (!access.place)
        return res
          .status(404)
          .json({ success: false, message: "Газрын мэдээлэл олдсонгүй" });
      if (!access.allowed) {
        return res
          .status(403)
          .json({ success: false, message: "Зөвшөөрөл байхгүй" });
      }
      filter.placeId = req.query.placeId;
    } else {
      const places = await Place.find({ ownerId: req.user._id }).select("_id");
      filter.placeId = { $in: places.map((p) => p._id) };
    }

    if (req.query.status && req.query.status !== "all")
      filter.status = req.query.status;
    if (req.query.date) {
      const { start, end } = dayRange(req.query.date);
      filter.datetime = { $gte: start, $lt: end };
    }

    const data = await Booking.find(filter)
      .populate("userId", "name phone email")
      .populate("placeId", "name category")
      .populate("serviceId", "name duration price")
      .populate("staffId", "name role")
      .sort({ datetime: -1 });

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const { placeId, date, staffId, tableId, serviceId } = req.query;
    if (!placeId || !date) {
      return res.status(400).json({
        success: false,
        message: "placeId болон date заавал шаардлагатай",
      });
    }

    const place = await Place.findById(placeId);
    if (!place)
      return res
        .status(404)
        .json({ success: false, message: "Газрын мэдээлэл олдсонгүй" });

    const { start, end } = dayRange(date);
    const service = serviceId
      ? await Service.findOne({ _id: serviceId, placeId }).select("duration")
      : null;
    const explicitDuration = Number(req.query.durationMinutes) || null;
    const slotDuration = explicitDuration || service?.duration || 30;

    const staff =
      STAFF_CATEGORIES.includes(place.category) && staffId
        ? await Staff.findOne({ _id: staffId, placeId, isActive: true }).select(
            "workingHours bufferMinutes",
          )
        : null;
    const workingWindow = getWorkingWindow(date, staff);
    const bookingSpan = getBookingSpanMinutes(
      { duration: slotDuration },
      staff,
    );

    if (place.category === "resort") {
      // For resorts we treat availability per-night per room (tables with type 'room')
      const rooms = (place.tables || []).filter(
        (t) => t.type === "room" && t.isActive,
      );
      const booked = await Booking.find({
        placeId,
        status: { $in: ACTIVE_STATUSES },
        $or: [
          {
            isOvernight: true,
            datetime: { $lt: end },
            endDate: { $gt: start },
          },
          { isOvernight: false, datetime: { $gte: start, $lt: end } },
        ],
      }).select("tableId datetime endDate isOvernight");

      const bookedRoomIds = new Set(
        booked.map((b) => b.tableId?.toString()).filter(Boolean),
      );

      const data = rooms.map((r) => ({
        roomId: r._id,
        name: r.name,
        capacity: r.capacity,
        price: r.price || 0,
        available: !bookedRoomIds.has(r._id.toString()),
      }));

      return res.json({ success: true, data });
    }

    const filter = {
      placeId,
      datetime: { $lt: workingWindow.end },
      status: { $in: ACTIVE_STATUSES },
    };

    if (STAFF_CATEGORIES.includes(place.category) && staffId)
      filter.staffId = staffId;
    if (TABLE_CATEGORIES.includes(place.category) && tableId)
      filter.tableId = tableId;

    filter.$or = [
      { end: { $gt: workingWindow.start } },
      { endDate: { $gt: workingWindow.start } },
    ];

    const booked = await Booking.find(filter).select(
      "datetime end endDate durationMinutes",
    );

    const slots = getSlots(
      workingWindow.start,
      workingWindow.end,
      bookingSpan.duration,
    ).map((time) => {
      const slotStart = parseTimeToDate(date, time);
      const slotEnd = new Date(slotStart.getTime() + bookingSpan.span * 60000);
      const available = !booked.some((b) => {
        const bookingStart = new Date(b.datetime);
        const bookingMinutes =
          Number(b.durationMinutes) || bookingSpan.span || bookingSpan.duration;
        const bookingEnd = getBookingEnd(b, bookingMinutes);
        return bookingStart < slotEnd && bookingEnd > slotStart;
      });

      return { time, available };
    });

    res.json({
      success: true,
      data: slots,
      meta: {
        slotMinutes: bookingSpan.duration,
        bufferMinutes: bookingSpan.buffer,
        windowStart: workingWindow.start,
        windowEnd: workingWindow.end,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getBookedTargets = async (req, res) => {
  try {
    const { placeId, datetime, serviceId, durationMinutes } = req.query;
    const from = new Date(datetime);
    const place = await Place.findById(placeId);
    if (!place)
      return res
        .status(404)
        .json({ success: false, message: "Газрын мэдээлэл олдсонгүй" });

    const service = serviceId
      ? await Service.findOne({ _id: serviceId, placeId }).select("duration")
      : null;
    const bookingMinutes = Number(durationMinutes) || service?.duration || 30;
    const to = new Date(from.getTime() + bookingMinutes * 60 * 1000);

    const data = await Booking.find({
      placeId,
      status: { $in: ACTIVE_STATUSES },
      datetime: { $lt: to },
      $or: [{ end: { $gt: from } }, { endDate: { $gt: from } }],
    }).select("staffId tableId");

    const staffIds = data.map((b) => b.staffId?.toString()).filter(Boolean);
    const tableIds = data.map((b) => b.tableId?.toString()).filter(Boolean);

    res.json({ success: true, data: { staffIds, tableIds } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { placeId, serviceId, staffId, tableId, datetime, note } = req.body;
    const place = await Place.findById(placeId);
    if (!place)
      return res
        .status(404)
        .json({ success: false, message: "Газрын мэдээлэл олдсонгүй" });

    const service = await Service.findOne({ _id: serviceId, placeId });
    if (!service)
      return res
        .status(404)
        .json({ success: false, message: "Үйлчилгээ олдсонгүй" });

    const validationError = validateTargetByCategory(place, {
      staffId,
      tableId,
    });
    if (validationError)
      return res.status(400).json({ success: false, message: validationError });

    if (staffId) {
      const staff = await Staff.findOne({
        _id: staffId,
        placeId,
        isActive: true,
      });
      if (!staff)
        return res
          .status(404)
          .json({ success: false, message: "Ажилтан олдсонгүй" });
    }

    if (tableId) {
      const table = place.tables.find(
        (t) => t._id.toString() === tableId && t.isActive,
      );
      if (!table)
        return res
          .status(404)
          .json({ success: false, message: "Ширээ/өрөөг олдсонгүй" });
    }

    // Use a transaction to avoid race conditions on high-concurrency resources
    const session = await mongoose.startSession();
    try {
      let created;
      await session.withTransaction(async () => {
        if (place.category === "resort") {
          // Overnight booking
          const nights = Number(req.body.nights) || 1;
          const start = new Date(datetime);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(end.getDate() + nights);

          const conflict = await Booking.findOne({
            placeId,
            tableId,
            status: { $in: ACTIVE_STATUSES },
            $or: [
              {
                isOvernight: true,
                datetime: { $lt: end },
                endDate: { $gt: start },
              },
              {
                isOvernight: false,
                datetime: { $lt: end },
                end: { $gt: start },
              },
            ],
          }).session(session);

          if (conflict) {
            throw { code: 409, message: "Тухайн өдөр/өрөө захиалагдсан байна" };
          }

          const tableType = tableId
            ? place.tables.find((t) => t._id.toString() === tableId)?.type ||
              null
            : null;

          created = await Booking.create(
            [
              {
                userId: req.user._id,
                placeId,
                serviceId,
                staffId: staffId || null,
                tableId: tableId || null,
                tableType,
                datetime: start,
                endDate: end,
                nights,
                isOvernight: true,
                note: note || "",
                totalPrice: service.price * nights,
                status: "pending",
                paymentStatus: "pending",
              },
            ],
            { session },
          );
          created = created[0];
        } else {
          // Time-based booking (staff or table)
          const dt = new Date(datetime);
          const staff = staffId
            ? await Staff.findById(staffId).session(session)
            : null;
          const buffer = staff?.bufferMinutes || 0;
          const duration = service.duration || 30;
          const end = new Date(dt.getTime() + (duration + buffer) * 60000);

          // Validate working hours if staff
          if (staff && staff.workingHours && staff.workingHours.length) {
            const day = dt.getDay();
            const wh = staff.workingHours.find((w) => w.day === day);
            if (wh) {
              const dayStart = parseTimeToDate(dt, wh.start);
              const dayEnd = parseTimeToDate(dt, wh.end);
              if (dt < dayStart || end > dayEnd) {
                throw {
                  code: 400,
                  message:
                    "Сонгосон цаг нь ажиллах цагийн хуваарилалтад нийцэхгүй",
                };
              }
            }
          }

          const conflict = await Booking.findOne({
            placeId,
            status: { $in: ACTIVE_STATUSES },
            $or: [
              staffId ? { staffId } : null,
              tableId ? { tableId } : null,
            ].filter(Boolean),
            datetime: { $lt: end },
            end: { $gt: dt },
          }).session(session);

          if (conflict) {
            throw { code: 409, message: "Тухайн цаг захиалагдсан байна" };
          }

          const tableType = tableId
            ? place.tables.find((t) => t._id.toString() === tableId)?.type ||
              null
            : null;

          const docs = await Booking.create(
            [
              {
                userId: req.user._id,
                placeId,
                serviceId,
                staffId: staffId || null,
                tableId: tableId || null,
                tableType,
                datetime: dt,
                end,
                durationMinutes: duration,
                note: note || "",
                totalPrice: service.price,
                status: "pending",
                paymentStatus: "pending",
              },
            ],
            { session },
          );
          created = docs[0];
        }
      });

      // populate and notify outside transaction
      const data = await Booking.findById(created._id)
        .populate("placeId", "name category")
        .populate("serviceId", "name duration price")
        .populate("staffId", "name role")
        .lean();

      await safeNotify({
        userId: place.ownerId,
        type: "booking",
        message: `Шинэ захиалга ирлээ: ${place.name} • ${service.name}`,
        relatedId: created._id,
      });

      // Emit realtime events
      try {
        const io = getIo();
        if (io) {
          io.to(`place:${place._id}`).emit("booking:created", {
            booking: data,
          });
          if (created.tableId)
            io.to(`room:${created.tableId}`).emit("booking:created", {
              booking: data,
            });
          if (created.staffId)
            io.to(`staff:${created.staffId}`).emit("booking:created", {
              booking: data,
            });
          io.to(`user:${req.user._id}`).emit("booking:created", {
            booking: data,
          });
        }
      } catch (e) {
        console.error("Socket emit error:", e.message);
      }

      return res.status(201).json({ success: true, data });
    } catch (e) {
      // handle throws from transaction
      if (e && e.code) {
        return res.status(e.code).json({ success: false, message: e.message });
      }
      console.error(e);
      return res
        .status(400)
        .json({ success: false, message: e.message || String(e) });
    } finally {
      session.endSession();
    }
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const row = await Booking.findById(req.params.id).populate(
      "placeId",
      "ownerId",
    );
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Захиалга олдсонгүй" });

    if (!ownerOrAdmin(row.placeId.ownerId, req.user)) {
      return res
        .status(403)
        .json({ success: false, message: "Зөвшөөрөл байхгүй" });
    }

    if (row.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Зөвхөн хүлээгдэж буй захиалгыг батална",
      });
    }

    row.status = "confirmed";
    row.confirmedAt = new Date();
    await row.save();

    await safeNotify({
      userId: row.userId,
      type: "booking",
      message: "Таны захиалга баталгаажлаа",
      relatedId: row._id,
    });

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    const row = await Booking.findById(req.params.id).populate(
      "placeId",
      "ownerId",
    );
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Захиалга олдсонгүй" });

    if (!ownerOrAdmin(row.placeId.ownerId, req.user)) {
      return res
        .status(403)
        .json({ success: false, message: "Зөвшөөрөл байхгүй" });
    }

    if (row.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Зөвхөн хүлээгдэж буй захиалгыг цуцална",
      });
    }

    row.status = "cancelled";
    row.rejectedAt = new Date();
    await row.save();

    await safeNotify({
      userId: row.userId,
      type: "booking",
      message: "Таны захиалгыг админ татгалзлаа",
      relatedId: row._id,
    });

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.markBookingPaid = async (req, res) => {
  try {
    const row = await Booking.findById(req.params.id).populate(
      "placeId",
      "ownerId",
    );
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Захиалга олдсонгүй" });

    if (!ownerOrAdmin(row.placeId.ownerId, req.user)) {
      return res
        .status(403)
        .json({ success: false, message: "Зөвшөөрөл байхгүй" });
    }

    if (row.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Зөвхөн баталгаажсан захиалгыг төлсөн гэж тэмдэглэнэ",
      });
    }

    row.paymentStatus = "paid";
    row.paidAt = new Date();
    await row.save();

    await safeNotify({
      userId: row.placeId.ownerId,
      type: "payment",
      message: "Төлбөр хийгдсэн захиалга бүртгэгдлээ",
      relatedId: row._id,
    });

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.completeBooking = async (req, res) => {
  try {
    const row = await Booking.findById(req.params.id).populate(
      "placeId",
      "ownerId",
    );
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Захиалга олдсонгүй" });

    if (!ownerOrAdmin(row.placeId.ownerId, req.user)) {
      return res
        .status(403)
        .json({ success: false, message: "Зөвшөөрөл байхгүй" });
    }

    if (row.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Зөвхөн баталгаажсан захиалгыг дуусгасан гэж тэмдэглэнэ",
      });
    }

    row.paymentStatus = "paid";
    row.status = "completed";
    row.completedAt = new Date();
    await row.save();
    await refreshPlaceRating(row.placeId._id);

    await safeNotify({
      userId: row.userId,
      type: "booking",
      message: "Таны захиалга амжилттай дууслаа",
      relatedId: row._id,
    });

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const row = await Booking.findById(req.params.id).populate(
      "placeId",
      "ownerId",
    );
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Захиалга олдсонгүй" });

    const canCancel =
      row.userId.toString() === req.user._id.toString() ||
      row.placeId.ownerId.toString() === req.user._id.toString();

    if (!canCancel) {
      return res
        .status(403)
        .json({ success: false, message: "Зөвшөөрөл байхгүй" });
    }

    row.status = "cancelled";
    await row.save();

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.reviewBooking = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const row = await Booking.findById(req.params.id);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Захиалга олдсонгүй" });

    if (row.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Зөвшөөрөл байхгүй" });
    }

    if (row.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Зөвхөн дууссан захиалгад үнэлгээ өгнө",
      });
    }

    row.rating = Math.max(1, Math.min(5, Number(rating) || 0));
    row.review = review || "";
    row.reviewedAt = new Date();
    await row.save();

    const place = await Place.findById(row.placeId).select("ownerId name");

    await refreshPlaceRating(row.placeId);

    if (place?.ownerId) {
      await safeNotify({
        userId: place.ownerId,
        type: "review",
        message: `Шинэ үнэлгээ ирлээ: ${place.name}`,
        relatedId: row._id,
      });
    }

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
