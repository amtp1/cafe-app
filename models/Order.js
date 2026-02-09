const mongoose = require("mongoose");

module.exports = mongoose.model("Order", {
  waiter: { type: String, required: true, trim: true },
  table: { type: Number, required: true },
  status: {
    type: String,
    default: "В работе"
  },
  items: [
    {
      name: { type: String, required: true, trim: true },
      qty: { type: Number, required: true },
      price: { type: Number, required: true },
      sum: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
