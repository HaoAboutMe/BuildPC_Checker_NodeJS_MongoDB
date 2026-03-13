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

/* --- Role Routes (Admin Only) --- */

// Get all roles
router.get("/", isAdmin, RoleController.getAllRoles);

// Create a new role
router.post("/", [
    isAdmin,
    body('name').notEmpty().withMessage('Tên quyền không được để trống').trim().escape(),
    body('description').optional().trim().escape(),
    validate
], RoleController.createRole);

// Get role by ID
router.get("/:id", [
    isAdmin,
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], RoleController.getRoleById);

// Soft delete role
router.delete("/:id", [
    isAdmin,
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], RoleController.deleteRole);

// Get all users belonging to a specific role ID
router.get("/:id/users", [
    isAdmin,
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], RoleController.getUsersByRole);

module.exports = router;