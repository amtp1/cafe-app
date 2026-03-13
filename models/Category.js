const mongoose = require("mongoose");

// Категории меню (как в iiko: Напитки, Горячие блюда, Десерты)
module.exports = mongoose.model("Category", {
  name: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 }
});
