const mongoose = require("mongoose");

module.exports = mongoose.model("Order", {
  waiter: String,
  table: Number,
  status: String,
  items: [
    {
      name: String,
      qty: Number,
      price: Number,
      sum: Number
    }
  ],
  total: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
