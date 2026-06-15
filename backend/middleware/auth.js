const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT токен шалгах
const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Нэвтрэх шаардлагатай" });
    }
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: "Хэрэглэгч олдсонгүй" });
    next();
  } catch {
    res.status(401).json({ success: false, message: "Токен хүчингүй" });
  }
};

// Admin эрх шалгах
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Зөвшөөрөл байхгүй" });
  }
  next();
};

const ownerOrAdmin = (ownerId, user) => {
  if (!user) return false;
  return ownerId?.toString() === user._id?.toString();
};

// Token үүсгэх
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

module.exports = { protect, adminOnly, ownerOrAdmin, signToken };
