const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, trim: true },
  nickname: { type: String, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: "waiter" },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);