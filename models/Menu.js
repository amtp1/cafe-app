const mongoose = require("mongoose");

module.exports = mongoose.model("Menu", {
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true }
});
