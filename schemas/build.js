let mongoose = require("mongoose");
let buildSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên cấu hình không được để trống"],
    },
    description: {
      type: String,
      default: "",
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    cpu: {
      type: mongoose.Types.ObjectId,
      ref: "cpu",
    },
    mainboard: {
      type: mongoose.Types.ObjectId,
      ref: "mainboard",
    },
    ram: {
      type: mongoose.Types.ObjectId,
      ref: "ram",
    },
    ramQuantity: {
      type: Number,
      default: 1,
    },
    vga: {
      type: mongoose.Types.ObjectId,
      ref: "vga",
    },
    ssds: [
      {
        type: mongoose.Types.ObjectId,
        ref: "ssd",
      },
    ],
    hdds: [
      {
        type: mongoose.Types.ObjectId,
        ref: "hdd",
      },
    ],
    psu: {
      type: mongoose.Types.ObjectId,
      ref: "psu",
    },
    pcCase: {
      type: mongoose.Types.ObjectId,
      ref: "pcCase",
    },
    cooler: {
      type: mongoose.Types.ObjectId,
      ref: "cooler",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = new mongoose.model("build", buildSchema);
