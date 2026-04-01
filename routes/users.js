const express = require("express");
const router = express.Router();
const userModel = require("../schemas/user");
const { body, param, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const authMiddleware = require("../utils/authMiddleware");
const { isAdmin, isOwnerOrAdmin } = require("../utils/roleMiddleware");

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
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).populate({
      path: "role",
      select: "name",
    });
    
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
    authMiddleware,
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
  async (req, res) => {
    try {
      const { firstname, lastname, dateOfBirth } = req.body;
      const userId = req.user.id;

      const allowedFields = ["firstname", "lastname", "dateOfBirth"];
      const requestFields = Object.keys(req.body || {});
      const hasDisallowedField = requestFields.some((field) => !allowedFields.includes(field));
      if (hasDisallowedField) {
        return res.status(400).json({
          success: false,
          message: "Chỉ được phép cập nhật firstname, lastname, dateOfBirth",
        });
      }

      const updateData = {};
      if (firstname !== undefined) updateData.firstname = firstname;
      if (lastname !== undefined) updateData.lastname = lastname;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp ít nhất một trường để cập nhật",
        });
      }

      const existingUser = await userModel.findById(userId);
      if (!existingUser || existingUser.isDeleted) {
        return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
      }

      const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).populate({
        path: "role",
        select: "name",
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật thông tin thành công",
        data: updatedUser
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
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
    authMiddleware,
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
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await userModel.findById(userId).select("+password");
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Đổi mật khẩu thành công"
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
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
router.get("/", authMiddleware, isAdmin, async function (req, res, next) {
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
    authMiddleware,
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
 * /api/v1/users/role/{roleId}:
 *   get:
 *     summary: List users by role ID (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/role/:roleId",
  [
    authMiddleware,
    param("roleId").isMongoId().withMessage("Role ID không hợp lệ"),
    validate,
    isAdmin,
  ],
  async (req, res) => {
    try {
      const { roleId } = req.params;
      const users = await userModel.find({ role: roleId, isDeleted: false }).populate({
        path: "role",
        select: "name",
      });

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/users/{id}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role: { type: string, example: "65f...abc" }
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put(
  "/:id/role",
  [
    authMiddleware,
    param("id").isMongoId().withMessage("ID người dùng không hợp lệ"),
    body("role")
      .notEmpty()
      .withMessage("Role ID là bắt buộc")
      .isMongoId()
      .withMessage("Role ID không hợp lệ"),
    validate,
    isAdmin,
  ],
  async (req, res) => {
    try {
      const { role } = req.body;
      const targetUserId = req.params.id;

      const updatedUser = await userModel.findByIdAndUpdate(
        targetUserId,
        { role },
        { new: true, runValidators: true }
      ).populate({
        path: "role",
        select: "name",
      });

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật vai trò người dùng thành công",
        data: updatedUser
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
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
  [authMiddleware, param("id").isMongoId().withMessage("ID không hợp lệ"), validate, isAdmin],
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
