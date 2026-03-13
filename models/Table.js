const mongoose = require("mongoose");

// Столы (как в iiko: номер, зал, количество мест)
module.exports = mongoose.model("Table", {
  number: { type: Number, required: true },
  hall: { type: mongoose.Schema.Types.ObjectId, ref: "Hall" },
  seats: { type: Number, default: 4 }
});
