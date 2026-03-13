let mongoose = require("mongoose");
let hddSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name không được để trống"],
      unique: true,
    },
    formFactor: {
      type: mongoose.Types.ObjectId,
      ref: "formFactor",
      required: [true, "formFactor không được để trống"],
    },
    interfaceType: {
      type: mongoose.Types.ObjectId,
      ref: "interfaceType",
      required: [true, "interfaceType không được để trống"],
    },
    capacity: {
      type: Number,
      required: [true, "capacity không được để trống"],
    },
    tdp: {
      type: Number,
      required: [true, "tdp không được để trống"],
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
module.exports = new mongoose.model("hdd", hddSchema);
