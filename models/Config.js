const mongoose = require("mongoose");

// Ключ-значение для настроек (кодовое слово отмены заказа и т.п.)
module.exports = mongoose.model("Config", {
  key: { type: String, required: true, unique: true },
  value: { type: String, default: "" }
});
