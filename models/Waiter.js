const mongoose = require("mongoose");

module.exports = mongoose.model("Waiter", {
  name: { type: String, required: true, trim: true }
});
