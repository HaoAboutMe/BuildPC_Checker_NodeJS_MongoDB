const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const roleModel = require("../schemas/role");
const userModel = require("../schemas/user");
const Game = require("../schemas/game");

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

    // 3. Seed Games (upsert by name)
    const games = [
      {
        name: "CS2",
        coverImageUrl: "",
        minCpuScore: 9000,
        minGpuScore: 7000,
        minRamGb: 8,
        recCpuScore: 14000,
        recGpuScore: 12000,
        recRamGb: 16,
        baseFpsLow: 140,
        baseFpsMedium: 110,
        baseFpsHigh: 80,
        isDeleted: false,
      },
      {
        name: "God of War",
        coverImageUrl: "",
        minCpuScore: 12000,
        minGpuScore: 12000,
        minRamGb: 8,
        recCpuScore: 17000,
        recGpuScore: 18000,
        recRamGb: 16,
        baseFpsLow: 90,
        baseFpsMedium: 70,
        baseFpsHigh: 55,
        isDeleted: false,
      },
      {
        name: "Cyberpunk 2077",
        coverImageUrl: "",
        minCpuScore: 13000,
        minGpuScore: 14000,
        minRamGb: 12,
        recCpuScore: 20000,
        recGpuScore: 22000,
        recRamGb: 16,
        baseFpsLow: 80,
        baseFpsMedium: 60,
        baseFpsHigh: 45,
        isDeleted: false,
      },
      {
        name: "Elden Ring",
        coverImageUrl: "",
        minCpuScore: 11000,
        minGpuScore: 11000,
        minRamGb: 12,
        recCpuScore: 16000,
        recGpuScore: 15000,
        recRamGb: 16,
        baseFpsLow: 85,
        baseFpsMedium: 65,
        baseFpsHigh: 50,
        isDeleted: false,
      },
      {
        name: "Apex Legends",
        coverImageUrl: "",
        minCpuScore: 9000,
        minGpuScore: 8000,
        minRamGb: 8,
        recCpuScore: 14000,
        recGpuScore: 13000,
        recRamGb: 16,
        baseFpsLow: 150,
        baseFpsMedium: 120,
        baseFpsHigh: 90,
        isDeleted: false,
      },
      {
        name: "Forza Horizon 5",
        coverImageUrl: "",
        minCpuScore: 11000,
        minGpuScore: 13000,
        minRamGb: 8,
        recCpuScore: 16000,
        recGpuScore: 19000,
        recRamGb: 16,
        baseFpsLow: 95,
        baseFpsMedium: 75,
        baseFpsHigh: 60,
        isDeleted: false,
      },
      {
        name: "Red Dead Redemption 2",
        coverImageUrl: "",
        minCpuScore: 12000,
        minGpuScore: 13000,
        minRamGb: 12,
        recCpuScore: 17000,
        recGpuScore: 20000,
        recRamGb: 16,
        baseFpsLow: 85,
        baseFpsMedium: 65,
        baseFpsHigh: 50,
        isDeleted: false,
      },
      {
        name: "The Witcher 3",
        coverImageUrl: "",
        minCpuScore: 9000,
        minGpuScore: 9000,
        minRamGb: 8,
        recCpuScore: 13000,
        recGpuScore: 14000,
        recRamGb: 16,
        baseFpsLow: 110,
        baseFpsMedium: 85,
        baseFpsHigh: 65,
        isDeleted: false,
      },
      {
        name: "GTA V",
        coverImageUrl: "",
        minCpuScore: 8000,
        minGpuScore: 7000,
        minRamGb: 8,
        recCpuScore: 12000,
        recGpuScore: 11000,
        recRamGb: 16,
        baseFpsLow: 130,
        baseFpsMedium: 100,
        baseFpsHigh: 75,
        isDeleted: false,
      },
      {
        name: "Fortnite",
        coverImageUrl: "",
        minCpuScore: 8000,
        minGpuScore: 7000,
        minRamGb: 8,
        recCpuScore: 13000,
        recGpuScore: 12000,
        recRamGb: 16,
        baseFpsLow: 160,
        baseFpsMedium: 120,
        baseFpsHigh: 90,
        isDeleted: false,
      },
      {
        name: "Valorant",
        coverImageUrl: "",
        minCpuScore: 6500,
        minGpuScore: 5500,
        minRamGb: 8,
        recCpuScore: 10000,
        recGpuScore: 8000,
        recRamGb: 16,
        baseFpsLow: 220,
        baseFpsMedium: 180,
        baseFpsHigh: 140,
        isDeleted: false,
      },
      {
        name: "Hogwarts Legacy",
        coverImageUrl: "",
        minCpuScore: 14000,
        minGpuScore: 15000,
        minRamGb: 16,
        recCpuScore: 20000,
        recGpuScore: 22000,
        recRamGb: 32,
        baseFpsLow: 75,
        baseFpsMedium: 55,
        baseFpsHigh: 40,
        isDeleted: false,
      },
    ];

    const ops = games.map((g) => ({
      updateOne: {
        filter: { name: g.name },
        update: { $set: g },
        upsert: true,
      },
    }));
    const result = await Game.bulkWrite(ops, { ordered: false });
    console.log(
      `[Seed] Games upserted: inserted=${result.upsertedCount || 0}, modified=${result.modifiedCount || 0}`,
    );
  } catch (error) {
    console.error(`[Seed Error] Đã xảy ra lỗi khi tạo dữ liệu mẫu:`, error);
  }
};

module.exports = seedData;
