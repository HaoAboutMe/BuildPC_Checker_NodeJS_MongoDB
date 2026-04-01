var express = require('express');
var router = express.Router();
const roleModel = require("../schemas/role");
const userModel = require("../schemas/user");
const authMiddleware = require('../utils/authMiddleware');
const { isAdmin } = require('../utils/roleMiddleware');
const { body, param, validationResult } = require('express-validator');

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

/**
 * @swagger
 * tags:
 *   name: Role
 *   description: Role management (Admin only)
 */

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", [authMiddleware, isAdmin], async (req, res) => {
    try {
      const roles = await roleModel.find({ isDeleted: false });
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     summary: Create new role
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name: { type: string, example: "moderator" }
 *               description: { type: string, example: "Role for system moderation" }
 *     responses:
 *       201:
 *         description: Role created
 */
router.post("/", [
    authMiddleware,
    isAdmin,
    body('name').notEmpty().withMessage('Tên quyền không được để trống').trim().escape(),
    body('description').optional().trim().escape(),
    validate
], async (req, res) => {
    try {
      const { name, description } = req.body;
      const existingRole = await roleModel.findOne({ name });
      if (existingRole) {
        return res.status(400).json({ success: false, message: "Quyền này đã tồn tại" });
      }

      const newRole = new roleModel({ name, description });
      await newRole.save();
      res.status(201).json({ success: true, data: newRole });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Role]
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
router.get("/:id", [
    authMiddleware,
    isAdmin,
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], async (req, res) => {
    try {
      const role = await roleModel.findById(req.params.id);
      if (!role || role.isDeleted) {
        return res.status(404).json({ success: false, message: "Không tìm thấy quyền" });
      }
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      res.status(404).json({ success: false, message: "Không tìm thấy quyền" });
    }
});

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   delete:
 *     summary: Delete role (Soft delete)
 *     tags: [Role]
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
 *         description: Role deleted
 */
router.delete("/:id", [
    authMiddleware,
    isAdmin,
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], async (req, res) => {
    try {
      const role = await roleModel.findById(req.params.id);
      if (!role || role.isDeleted) {
        return res.status(404).json({ success: false, message: "Không tìm thấy quyền" });
      }
      role.isDeleted = true;
      await role.save();
      res.status(200).json({ success: true, message: "Đã xóa mềm quyền thành công", data: role });
    } catch (error) {
      res.status(404).json({ success: false, message: "Không tìm thấy quyền" });
    }
});

/**
 * @swagger
 * /api/v1/roles/{id}/users:
 *   get:
 *     summary: Get all users by role ID
 *     tags: [Role]
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
router.get("/:id/users", [
    authMiddleware,
    isAdmin,
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], async (req, res) => {
    try {
      const roleId = req.params.id;
      const role = await roleModel.findById(roleId);
      if (!role || role.isDeleted) {
        return res.status(404).json({ success: false, message: "Không tìm thấy quyền" });
      }

      const users = await userModel.find({
        role: roleId,
        isDeleted: false
      }).populate({
        path: "role",
        select: "name"
      });

      res.status(200).json({ success: true, data: users });
    } catch (error) {
      res.status(404).json({ success: false, message: "Không tìm thấy quyền hoặc ID không hợp lệ" });
    }
});

module.exports = router;