const mongoose = require("mongoose");

module.exports = mongoose.model("Recipe", {
  menu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
    required: true
  },
  components: [
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

