let mongoose = require("mongoose");
let ramSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name không được để trống"],
      unique: true,
    },
    ramType: {
      type: mongoose.Types.ObjectId,
      ref: "ramType",
      required: [true, "ramType không được để trống"],
    },
    ramBus: {
      type: Number,
      required: [true, "ramBus không được để trống"],
    },
    ramCas: {
      type: Number,
      required: [true, "ramCas không được để trống"],
    },
    capacityPerStick: {
      type: Number,
      required: [true, "capacityPerStick không được để trống"],
    },
    quantity: {
      type: Number,
      required: [true, "quantity không được để trống"],
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
module.exports = new mongoose.model("ram", ramSchema);
