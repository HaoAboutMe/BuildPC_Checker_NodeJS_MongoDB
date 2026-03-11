var express = require('express');
var router = express.Router();
const slugify = require('slugify');
let roleModel = require('../schemas/role');
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

//Hàm get all role
router.get("/", async function(req, res, next){
    let result = await roleModel.find({
        isDeleted:false
    })
    res.send(result)
})

router.post("/", [
    body('name').notEmpty().withMessage('Tên quyền không được để trống').trim().escape(),
    body('description').optional().trim().escape(),
    validate
], async function(req, res, next) {
    try {
        const existingRole = await roleModel.findOne({ name: req.body.name });
        if (existingRole) {
            return res.status(400).send({ success: false, message: "Quyền này đã tồn tại" });
        }

        let newRole = new roleModel({
            name: req.body.name,
            description: req.body.description
        })

        await newRole.save();
        res.status(201).send(newRole);
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
})

// Get role by ID
router.get("/:id", [
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], async function(req, res, next) {
  try {
    let result = await roleModel.findById(req.params.id);
    if (!result || result.isDeleted) {
      return res.status(404).send({ message: "ROLE NOT FOUND" });
    }
    res.send(result);
  } catch (error) {
    res.status(404).send({ message: "ROLE NOT FOUND" });
  }
});

// Xóa mềm role
router.delete("/:id", [
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], async function(req, res, next) {
  try {
    let result = await roleModel.findById(req.params.id);
    if (!result || result.isDeleted) {
      return res.status(404).send({ message: "ROLE NOT FOUND" });
    }
    result.isDeleted = true;
    await result.save();
    res.send({ message: "Soft deleted successfully", data: result });
  } catch (error) {
    res.status(404).send({ message: "ROLE NOT FOUND" });
  }
});

let userModel = require("../schemas/user");
// Lấy tất cả user thuộc một role ID cụ thể
router.get("/:id/users", [
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validate
], async function (req, res, next) {
  try {
    let roleId = req.params.id;
    // Kiểm tra xem role có tồn tại không
    let role = await roleModel.findById(roleId);
    if (!role || role.isDeleted) {
      return res.status(404).send({ message: "ROLE NOT FOUND" });
    }

    // Tìm tất cả user có role khớp với roleId và chưa bị xóa mềm
    let result = await userModel.find({
      role: roleId,
      isDeleted: false
    }).populate({
      path: "role",
      select: "name"
    });

    res.send(result);
  } catch (error) {
    res.status(404).send({ message: "ROLE NOT FOUND OR INVALID ID" });
  }
});

module.exports = router;