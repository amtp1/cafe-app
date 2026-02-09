const mongoose = require("mongoose");

module.exports = mongoose.model("Ingredient", {
  name: { type: String, required: true, unique: true, trim: true },
  unit: { type: String, default: "шт" }
});

