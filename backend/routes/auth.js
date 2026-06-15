const router = require("express").Router();
const User = require("../models/User");
const { protect, signToken } = require("../middleware/auth");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Имэйл бүртгэлтэй байна" });

    const user = await User.create({ name, email, password, phone });
    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: "Имэйл эсвэл нууц үг буруу" });

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  const { _id, name, email, role, phone, avatar } = req.user;
  res.json({ success: true, data: { _id, name, email, role, phone, avatar } });
});

// PUT /api/auth/profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
