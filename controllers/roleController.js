const roleModel = require("../schemas/role");
const userModel = require("../schemas/user");

const RoleController = {
  // Get all roles (not deleted)
  getAllRoles: async (req, res) => {
    try {
      const roles = await roleModel.find({ isDeleted: false });
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Create a new role
  createRole: async (req, res) => {
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
  },

  // Get role by ID
  getRoleById: async (req, res) => {
    try {
      const role = await roleModel.findById(req.params.id);
      if (!role || role.isDeleted) {
        return res.status(404).json({ success: false, message: "Không tìm thấy quyền" });
      }
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      res.status(404).json({ success: false, message: "Không tìm thấy quyền" });
    }
  },

  // Soft delete role
  deleteRole: async (req, res) => {
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
  },

  // Get all users belonging to a specific role ID
  getUsersByRole: async (req, res) => {
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
  }
};

module.exports = RoleController;
