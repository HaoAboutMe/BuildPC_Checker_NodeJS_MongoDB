let mongoose = require("mongoose");

let gameSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name không được để trống"],
      trim: true,
    },
    coverImageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    minCpuScore: { type: Number, required: true, min: 0 },
    minGpuScore: { type: Number, required: true, min: 0 },
    minRamGb: { type: Number, required: true, min: 0 },

    recCpuScore: { type: Number, required: true, min: 0 },
    recGpuScore: { type: Number, required: true, min: 0 },
    recRamGb: { type: Number, required: true, min: 0 },

    baseFpsLow: { type: Number, required: true, min: 0 },
    baseFpsMedium: { type: Number, required: true, min: 0 },
    baseFpsHigh: { type: Number, required: true, min: 0 },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

gameSchema.index({ name: 1 }, { unique: true });

module.exports = new mongoose.model("game", gameSchema);
