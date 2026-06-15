const { Place, Service } = require("../models");
const { ownerOrAdmin } = require("../middleware/auth");

async function canWrite(placeId, user) {
  const place = await Place.findById(placeId).select("ownerId");
  if (!place)
    return { ok: false, code: 404, message: "Газрын мэдээлэл олдсонгүй" };
  if (!ownerOrAdmin(place.ownerId, user))
    return { ok: false, code: 403, message: "Зөвшөөрөл байхгүй" };
  return { ok: true, place };
}

exports.listServices = async (req, res) => {
  try {
    const { placeId } = req.query;
    const filter = { isActive: true };
    if (placeId) filter.placeId = placeId;
    const rows = await Service.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const check = await canWrite(req.body.placeId, req.user);
    if (!check.ok)
      return res
        .status(check.code)
        .json({ success: false, message: check.message });
    const row = await Service.create(req.body);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const row = await Service.findById(req.params.id);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Үйлчилгээ олдсонгүй" });

    const check = await canWrite(row.placeId, req.user);
    if (!check.ok)
      return res
        .status(check.code)
        .json({ success: false, message: check.message });

    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const row = await Service.findById(req.params.id);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Үйлчилгээ олдсонгүй" });

    const check = await canWrite(row.placeId, req.user);
    if (!check.ok)
      return res
        .status(check.code)
        .json({ success: false, message: check.message });

    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Амжилттай устгалаа" });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
