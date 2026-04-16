const mongoose = require("mongoose");

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
    toolType: {
      type: String,
      enum: [
        "minitool1",
        "minitool2_cholesterol",
        "minitool2_speedtrap",
        "minitool3",
      ],
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Scenario", scenarioSchema);
