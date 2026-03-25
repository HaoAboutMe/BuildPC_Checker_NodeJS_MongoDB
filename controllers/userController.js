const userModel = require("../schemas/user");
const bcrypt = require("bcrypt");

const UserController = {
  // Xem profile của bản thân
  getProfile: async (req, res) => {
    try {
      // req.user được gán từ authMiddleware
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
  },

  // Cập nhật profile bản thân
  updateProfile: async (req, res) => {
    try {
      const { username, firstname, lastname, dateOfBirth } = req.body;
      const userId = req.user.id;

      // Kiểm tra username duy nhất (nếu có thay đổi)
      if (username) {
        const existingUser = await userModel.findOne({ 
          username, 
          _id: { $ne: userId } 
        });
        if (existingUser) {
          return res.status(400).json({ success: false, message: "Username đã được sử dụng" });
        }
      }

      const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        { username, firstname, lastname, dateOfBirth },
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

  // Đổi mật khẩu
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "Vui lòng cung cấp mật khẩu cũ và mới" });
      }

      // Tìm user và lấy password
      const user = await userModel.findById(userId).select("+password");
      
      // Kiểm tra mật khẩu cũ
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác" });
      }

      // Hash mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Cập nhật
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
  
  // Admin cập nhật vai trò (role) của bất kỳ user nào
  updateUserByAdmin: async (req, res) => {
    try {
      const { role } = req.body;
      const targetUserId = req.params.id;

      if (!role) {
        return res.status(400).json({ success: false, message: "Vui lòng cung cấp Role ID" });
      }

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

  // Lấy danh sách user theo Role ID
  getUsersByRole: async (req, res) => {
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
  }
};

module.exports = UserController;
