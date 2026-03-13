let mongoose = require("mongoose");
let pcCaseSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name không được để trống"],
      unique: true,
    },
    size: {
      type: mongoose.Types.ObjectId,
      ref: "caseSize",
      required: [true, "size không được để trống"],
    },
    maxVgaLengthMm: {
      type: Number,
      required: [true, "maxVgaLengthMm không được để trống"],
    },
    maxCoolerHeightMm: {
      type: Number,
      required: [true, "maxCoolerHeightMm không được để trống"],
    },
    maxRadiatorSize: {
      type: Number,
      default: 0,
    },
    drive35Slot: {
      type: Number,
      default: 0,
    },
    drive25Slot: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = new mongoose.model("pcCase", pcCaseSchema);
