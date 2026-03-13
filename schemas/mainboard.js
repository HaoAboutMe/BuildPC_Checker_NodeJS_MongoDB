let mongoose = require("mongoose");
let mainboardSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name không được để trống"],
      unique: true,
    },
    socket: {
      type: mongoose.Types.ObjectId,
      ref: "socket",
      required: [true, "socket không được để trống"],
    },
    vrmPhase: {
      type: Number,
      required: [true, "vrmPhase không được để trống"],
    },
    cpuTdpSupport: {
      type: Number,
      required: [true, "cpuTdpSupport không được để trống"],
    },
    ramType: {
      type: mongoose.Types.ObjectId,
      ref: "ramType",
      required: [true, "ramType không được để trống"],
    },
    ramBusMax: {
      type: Number,
      required: [true, "ramBusMax không được để trống"],
    },
    ramSlot: {
      type: Number,
      required: [true, "ramSlot không được để trống"],
    },
    ramMaxCapacity: {
      type: Number,
      required: [true, "ramMaxCapacity không được để trống"],
    },
    size: {
      type: mongoose.Types.ObjectId,
      ref: "caseSize",
      required: [true, "size không được để trống"],
    },
    pcieVgaVersion: {
      type: mongoose.Types.ObjectId,
      ref: "pcieVersion",
      required: [true, "pcieVgaVersion không được để trống"],
    },
    m2Slot: {
      type: Number,
      default: 0,
    },
    sataSlot: {
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
module.exports = new mongoose.model("mainboard", mainboardSchema);
