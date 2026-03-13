let mongoose = require("mongoose");
let psuSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name không được để trống"],
      unique: true,
    },
    wattage: {
      type: Number,
      required: [true, "wattage không được để trống"],
    },
    efficiency: {
      type: String,
      default: "",
    },
    pcieConnectors: [
      {
        type: mongoose.Types.ObjectId,
        ref: "pcieConnector",
      },
    ],
    sataConnector: {
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
module.exports = new mongoose.model("psu", psuSchema);
