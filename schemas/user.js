let mongoose = require("mongoose");
let userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username không được để trống"],
      unique: true,
    },
    firstname: {
      type: String,
      required: [true, "firstname không được để trống"],
    },
    lastname: {
      type: String,
      required: [true, "lastname không được để trống"],
    },
    email: {
      type: String,
      required: [true, "email không được để trống"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "password không được để trống"],
      select: false,
    },
    dateOfBirth: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyToken: {
      type: String,
    },
    role: {
      type: mongoose.Types.ObjectId,
      ref: "role",
    },
    refreshToken: {
      type: String,
    },
    lastLogoutAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = new mongoose.model("user", userSchema);
