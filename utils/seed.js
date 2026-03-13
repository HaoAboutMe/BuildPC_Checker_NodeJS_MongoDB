const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const roleModel = require("../schemas/role");
const userModel = require("../schemas/user");

const seedData = async () => {
  try {
    // 1. Tạo các Role mặc định nếu chưa tồn tại
    const roles = ["admin", "user", "manager"];
    let adminRoleId = null;

    for (const roleName of roles) {
      let role = await roleModel.findOne({ name: roleName });
      if (!role) {
        role = await roleModel.create({
          name: roleName,
          description: `Mặc định cho ${roleName}`,
        });
        console.log(`[Seed] Đã tạo role: ${roleName}`);
      }
      if (roleName === "admin") {
        adminRoleId = role._id;
      }
    }

    // 2. Tạo Admin User mặc định nếu chưa tồn tại
    const adminEmail = "haoaboutme@gmail.com";
    const existingAdmin = await userModel.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin@123", salt);

      const adminUser = new userModel({
        username: "AdminHao",
        firstname: "Admin",
        lastname: "Hảo",
        email: adminEmail,
        password: hashedPassword,
        dateOfBirth: new Date(),
        isVerified: true, // Admin mặc định được xác thực luôn
        role: adminRoleId,
      });

      await adminUser.save();
      console.log(`[Seed] Đã tạo tài khoản Admin mặc định: ${adminEmail}`);
    } else {
      console.log(`[Seed] Tài khoản Admin đã tồn tại.`);
    }
  } catch (error) {
    console.error(`[Seed Error] Đã xảy ra lỗi khi tạo dữ liệu mẫu:`, error);
  }
};

module.exports = seedData;
