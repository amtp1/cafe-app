const mongoose = require("mongoose");

module.exports = mongoose.model("Waiter", {
  name: String
});
