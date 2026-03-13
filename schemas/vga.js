let mongoose = require("mongoose");
let vgaSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name không được để trống"],
      unique: true,
    },
    lengthMm: {
      type: Number,
      required: [true, "lengthMm không được để trống"],
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
    powerConnector: {
      type: mongoose.Types.ObjectId,
      ref: "pcieConnector",
      required: [true, "powerConnector không được để trống"],
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
module.exports = new mongoose.model("vga", vgaSchema);
