var express = require('express');
var router = express.Router();
const RoleController = require('../controllers/roleController');
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
router.get("/", isAdmin, RoleController.getAllRoles);

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
    isAdmin,
    body('name').notEmpty().withMessage('Tên quyền không được để trống').trim().escape(),
    body('description').optional().trim().escape(),
    validate
], RoleController.createRole);

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
    isAdmin,
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], RoleController.getRoleById);

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
    isAdmin,
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], RoleController.deleteRole);

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
    isAdmin,
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], RoleController.getUsersByRole);

module.exports = router;