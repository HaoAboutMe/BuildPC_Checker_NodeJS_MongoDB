let mongoose = require("mongoose");
let coolerSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name không được để trống"],
      unique: true,
    },
    coolerType: {
      type: mongoose.Types.ObjectId,
      ref: "coolerType",
      required: [true, "coolerType không được để trống"],
    },
    radiatorSize: {
      type: Number,
      default: 0,
    },
    heightMm: {
      type: Number,
      default: 0,
    },
    tdpSupport: {
      type: Number,
      required: [true, "tdpSupport không được để trống"],
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
module.exports = new mongoose.model("cooler", coolerSchema);
