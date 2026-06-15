const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Нэр оруулна уу"] },
    email: {
      type: String,
      required: [true, "Имэйл оруулна уу"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Нууц үг оруулна уу"],
      minlength: 6,
      select: false,
    },
    phone: { type: String },
    role: { type: String, enum: ["user", "owner", "admin"], default: "user" },
    avatar: { type: String, default: "" },
  },
  { timestamps: true },
);

// Нууц үг hash хийх
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Нууц үг шалгах
userSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
