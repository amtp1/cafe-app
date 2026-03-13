const mongoose = require("mongoose");

// Поставщики (справочник для закупок, как в iiko)
module.exports = mongoose.model("Supplier", {
  name: { type: String, required: true, trim: true },
  contact: { type: String, trim: true }
});
