const mongoose = require("mongoose");

const batteryItemSchema = new mongoose.Schema({
  brand: {
    type: String,
    enum: ["Tough Cell", "Always Ready"],
    required: true,
  },
  lifespan: {
    type: Number,
    required: true,
    min: 1,
    max: 130,
  },
  visible: {
    type: Boolean,
    default: true,
  },
});

const scenarioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    data: [batteryItemSchema],
    minLifespan: {
      type: Number,
      default: null,
    },
    maxLifespan: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Scenario", scenarioSchema);
