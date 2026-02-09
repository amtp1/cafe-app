const mongoose = require("mongoose");

module.exports = mongoose.model("Purchase", {
  date: {
    type: Date,
    default: Date.now
  },
  supplier: { type: String, trim: true },
  items: [
    {
      ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ingredient",
        required: true
      },
      qty: { type: Number, required: true },
      costTotal: { type: Number, required: true }
    }
  ]
});

