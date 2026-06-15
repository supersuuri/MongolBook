const { Place, Staff } = require("../models");
const { ownerOrAdmin } = require("../middleware/auth");

async function canWrite(placeId, user) {
  const place = await Place.findById(placeId).select("ownerId");
  if (!place)
    return { ok: false, code: 404, message: "Газрын мэдээлэл олдсонгүй" };
  if (!ownerOrAdmin(place.ownerId, user))
    return { ok: false, code: 403, message: "Зөвшөөрөл байхгүй" };
  return { ok: true, place };
}

exports.listStaff = async (req, res) => {
  try {
    const { placeId } = req.query;
    const filter = placeId ? { placeId } : {};
    const staffs = await Staff.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: staffs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const check = await canWrite(req.body.placeId, req.user);
    if (!check.ok)
      return res
        .status(check.code)
        .json({ success: false, message: check.message });
    const staff = await Staff.create(req.body);
    res.status(201).json({ success: true, data: staff });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const row = await Staff.findById(req.params.id);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Ажилтан олдсонгүй" });
    const check = await canWrite(row.placeId, req.user);
    if (!check.ok)
      return res
        .status(check.code)
        .json({ success: false, message: check.message });

    const updated = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const row = await Staff.findById(req.params.id);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Ажилтан олдсонгүй" });
    const check = await canWrite(row.placeId, req.user);
    if (!check.ok)
      return res
        .status(check.code)
        .json({ success: false, message: check.message });

    await Staff.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Амжилттай устгалаа" });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
