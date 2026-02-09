const mongoose = require("mongoose");

module.exports = mongoose.model("WriteOff", {
  date: {
    type: Date,
    default: Date.now
  },
  reason: { type: String, trim: true },
  items: [
    {
      ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ingredient",
        required: true
      },
      qty: { type: Number, required: true }
    }
  ]
});

