let mongoose = require("mongoose");
let roleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "name khong duoc de trong"],
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
module.exports = new mongoose.model("role", roleSchema);
