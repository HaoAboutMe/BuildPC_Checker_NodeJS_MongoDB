var express = require("express");
var router = express.Router();
const AuthenticationController = require("../controllers/authenticationController");
const { body, validationResult } = require("express-validator");

// Middleware validation cho Register
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

const registerValidation = [
  body("username")
    .notEmpty()
    .withMessage("username không được để trống")
    .isLength({ min: 3 })
    .withMessage("username phải ít nhất 3 ký tự"),
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
    .withMessage(
      "Mật khẩu phải chứa ít nhất 1 ký tự viết hoa, 1 ký tự viết thường, 1 số, 1 ký tự đặc biệt và dài ít nhất 8 ký tự",
    ),
  validate,
];

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, example: "user123" }
 *               firstname: { type: string, example: "Hao" }
 *               lastname: { type: string, example: "Nguyen" }
 *               email: { type: string, example: "user@example.com" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       201:
 *         description: Registered successfully
 */
router.post("/register", registerValidation, AuthenticationController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier: { type: string, example: "user123" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post(
  "/login",
  [
    body("identifier")
      .notEmpty()
      .withMessage("Username hoặc Email không được để trống"),
    body("password").notEmpty().withMessage("Password không được để trống"),
    validate,
  ],
  AuthenticationController.login,
);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification token sent to users email
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
router.get("/verify-email", AuthenticationController.verifyEmail);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string, example: "your_refresh_token_here" }
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post("/refresh-token", AuthenticationController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", AuthenticationController.logout);

module.exports = router;
