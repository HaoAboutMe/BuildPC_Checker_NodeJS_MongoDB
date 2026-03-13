let mongoose = require("mongoose");
let cpuSchema = mongoose.Schema(
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
    vrmMin: {
      type: Number,
      required: [true, "vrmMin không được để trống"],
    },
    igpu: {
      type: Boolean,
      default: false,
    },
    tdp: {
      type: Number,
      required: [true, "tdp không được để trống"],
    },
    pcieVersion: {
      type: mongoose.Types.ObjectId,
      ref: "pcieVersion",
      required: [true, "pcieVersion không được để trống"],
    },
    score: {
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
module.exports = new mongoose.model("cpu", cpuSchema);
