const mongoose = require("mongoose");

// Смены (заготовка как в iiko: открытие/закрытие смены)
module.exports = mongoose.model("Shift", {
  date: { type: Date, required: true },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});
