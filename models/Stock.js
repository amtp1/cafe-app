const mongoose = require("mongoose");

module.exports = mongoose.model("Stock", {
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    unique: true,
    required: true
  },
  quantity: { type: Number, default: 0 }
});

