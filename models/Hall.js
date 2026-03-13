const mongoose = require("mongoose");

// Залы (как в iiko: Основной зал, Терраса, Банкетный)
module.exports = mongoose.model("Hall", {
  name: { type: String, required: true, trim: true }
});
