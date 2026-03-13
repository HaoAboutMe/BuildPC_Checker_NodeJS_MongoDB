const express = require("express");
const router = express.Router();
const userModel = require("../schemas/user");
const { body, param, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const authMiddleware = require("../utils/authMiddleware");
const { isAdmin, isOwnerOrAdmin } = require("../utils/roleMiddleware");
const UserController = require("../controllers/userController");

// Common middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

/* --- Profile Routes (Authenticated) --- */

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile and management
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/me", UserController.getProfile);

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname: { type: string, example: "Hao" }
 *               lastname: { type: string, example: "Nguyen" }
 *               dateOfBirth: { type: string, format: date, example: "1995-01-01" }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
  "/me",
  [
    body("username")
      .optional()
      .isLength({ min: 3 })
      .withMessage("username phải ít nhất 3 ký tự"),
    body("firstname")
      .optional()
      .notEmpty()
      .withMessage("firstname không được để trống"),
    body("lastname")
      .optional()
      .notEmpty()
      .withMessage("lastname không được để trống"),
    body("dateOfBirth")
      .optional()
      .isISO8601()
      .withMessage("Ngày sinh không hợp lệ"),
    validate,
  ],
  UserController.updateProfile,
);

/**
 * @swagger
 * /api/v1/users/me/change-password:
 *   put:
 *     summary: Change password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword: { type: string, example: "Password123!" }
 *               newPassword: { type: string, example: "NewPassword123!" }
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put(
  "/me/change-password",
  [
    body("oldPassword")
      .notEmpty()
      .withMessage("Mật khẩu cũ không được để trống"),
    body("newPassword")
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage(
        "Mật khẩu mới phải chứa ít nhất 1 ký tự viết hoa, 1 ký tự viết thường, 1 số, 1 ký tự đặc biệt và dài ít nhất 8 ký tự",
      ),
    validate,
  ],
  UserController.changePassword,
);

/* --- Admin/Management Routes --- */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List all users (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", isAdmin, async function (req, res, next) {
  try {
    let users = await userModel.find({ isDeleted: false }).populate({
      path: "role",
      select: "name",
    });
    res.status(200).send({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/:id",
  [
    param("id").isMongoId().withMessage("ID không hợp lệ"),
    validate,
    isOwnerOrAdmin,
  ],
  async function (req, res, next) {
    try {
      let user = await userModel.findById(req.params.id).populate({
        path: "role",
        select: "name",
      });
      if (!user || user.isDeleted) {
        return res
          .status(404)
          .send({ success: false, message: "USER NOT FOUND" });
      }
      res.status(200).send({ success: true, data: user });
    } catch (error) {
      res.status(404).send({ success: false, message: "User not found" });
    }
  },
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Soft delete user (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("ID không hợp lệ"), validate, isAdmin],
  async function (req, res, next) {
    try {
      let user = await userModel.findById(req.params.id);
      if (!user || user.isDeleted) {
        return res
          .status(404)
          .send({ success: false, message: "USER NOT FOUND" });
      }
      user.isDeleted = true;
      await user.save();
      res.status(200).send({
        success: true,
        message: "Xóa mềm thành viên thành công",
      });
    } catch (error) {
      res.status(400).send({ success: false, message: error.message });
    }
  },
);

module.exports = router;
