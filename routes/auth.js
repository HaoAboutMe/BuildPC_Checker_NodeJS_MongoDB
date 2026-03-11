var express = require("express");
var router = express.Router();
const AuthenticationController = require("../controllers/authenticationController");
const { body, validationResult } = require("express-validator");

// Middleware validation cho Register
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

const registerValidation = [
  body("username").notEmpty().withMessage("username không được để trống").isLength({ min: 3 }).withMessage("username phải ít nhất 3 ký tự"),
  body("firstname").notEmpty().withMessage("firstname không được để trống"),
  body("lastname").notEmpty().withMessage("lastname không được để trống"),
  body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
  body("password")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage("Mật khẩu phải chứa ít nhất 1 ký tự viết hoa, 1 ký tự viết thường, 1 số, 1 ký tự đặc biệt và dài ít nhất 8 ký tự"),
  validate,
];

// Route Đăng ký
router.post("/register", registerValidation, AuthenticationController.register);

// Route Đăng nhập
router.post("/login", [
  body("identifier").notEmpty().withMessage("Username hoặc Email không được để trống"),
  body("password").notEmpty().withMessage("Password không được để trống"),
  validate
], AuthenticationController.login);

// Route Xác thực Email
router.get("/verify-email", AuthenticationController.verifyEmail);

// Route Refresh Token
router.post("/refresh-token", AuthenticationController.refreshToken);

// Route Đăng xuất
router.post("/logout", AuthenticationController.logout);

module.exports = router;
