const mongoose = require("mongoose");

module.exports = mongoose.model("Menu", {
  name: String,
  price: Number
});
