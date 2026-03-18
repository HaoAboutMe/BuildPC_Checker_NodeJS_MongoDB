const userModel = require("../schemas/user");
const roleModel = require("../schemas/role");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateAccessToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role ? user.role.name : "non-role",
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
    issuer: "BuildPC_Checker_API",
    jwtid: crypto.randomBytes(16).toString("hex"),
  });
};

const generateRefreshToken = (user) => {
  const payload = { id: user._id };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
    issuer: "BuildPC_Checker_API",
    jwtid: crypto.randomBytes(16).toString("hex"),
  });
};

const AuthenticationController = {
  // Login
  login: async (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng nhập đầy đủ thông tin" });
      }

      const user = await userModel
        .findOne({
          $or: [{ email: identifier }, { username: identifier }],
        })
        .populate("role")
        .select("+password");

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Thông tin đăng nhập không chính xác",
          });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Thông tin đăng nhập không chính xác",
          });
      }

      if (!user.isVerified) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Vui lòng xác thực email trước khi đăng nhập",
          });
      }

      // Tạo Access Token và Refresh Token
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Lưu Refresh Token vào database
      user.refreshToken = refreshToken;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        accessToken,
        refreshToken,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Refresh Token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res
          .status(400)
          .json({ success: false, message: "Refresh Token là bắt buộc" });
      }

      // Kiểm tra token trong database
      const user = await userModel.findOne({ refreshToken }).populate("role");
      if (!user) {
        return res
          .status(403)
          .json({ success: false, message: "Refresh Token không hợp lệ" });
      }

      // Xác thực token
      try {
        jwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch (err) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Refresh Token đã hết hạn hoặc không hợp lệ",
          });
      }

      // Tạo cặp token mới
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Cập nhật Refresh Token mới vào database
      user.refreshToken = newRefreshToken;
      await user.save();

      res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res
          .status(400)
          .json({ success: false, message: "Refresh Token là bắt buộc" });
      }

      const user = await userModel.findOne({ refreshToken });
      if (user) {
        user.refreshToken = undefined;
        user.lastLogoutAt = new Date();
        await user.save();
      }

      res.status(200).json({
        success: true,
        message: "Đăng xuất thành công",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Đăng ký tài khoản mới và gửi email xác thực
  register: async (req, res) => {
    try {
      const { username, firstname, lastname, email, password, dateOfBirth } =
        req.body;

      // Kiểm tra xem User đã tồn tại chưa
      const existingUser = await userModel.findOne({
        $or: [{ email }, { username }],
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Username hoặc Email đã tồn tại" });
      }

      // Lấy mặc định role "user" từ database (đã được seed sẵn)
      const userRole = await roleModel.findOne({ name: "user" });
      if (!userRole) {
        return res
          .status(500)
          .json({
            success: false,
            message: "Lỗi hệ thống: Role 'user' chưa được khởi tạo",
          });
      }

      // Hash mật khẩu
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Tạo mã xác thực ngẫu nhiên
      const verifyToken = crypto.randomBytes(32).toString("hex");

      const newUser = new userModel({
        username,
        firstname,
        lastname,
        email,
        password: hashedPassword,
        dateOfBirth,
        role: userRole._id, // Luôn gán mặc định là Role "user"
        isVerified: false,
        verifyToken,
      });

      await newUser.save();

      // Populate role để hiển thị tên role trong response
      await newUser.populate({
        path: "role",
        select: "name",
      });

      // Gửi email xác thực
      const verificationUrl = `http://localhost:3000/auth/verify-email?token=${verifyToken}&email=${email}`;

      const mailOptions = {
        from: '"Website BuildPC Checker" <lookatwidget@gmail.com>',
        to: email,
        subject: "Xác thực tài khoản của bạn",
        html: `
          <h1>Chào mừng ${firstname} ${lastname}!</h1>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại Website BuildPC Checker.</p>
          <p>Vui lòng nhấn vào đường dẫn bên dưới để xác thực tài khoản của bạn:</p>
          <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Xác thực tài khoản</a>
          <p>Nếu nút trên không hoạt động, hãy copy đường dẫn này: ${verificationUrl}</p>
        `,
      };

      await transporter.sendMail(mailOptions);

      // Trả về response (không bao gồm password)
      const userResponse = newUser.toObject();
      delete userResponse.password;

      res.status(201).json({
        success: true,
        message:
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
        data: userResponse,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Xác thực email qua token
  verifyEmail: async (req, res) => {
    try {
      const { token, email } = req.query;

      if (!token || !email) {
        return res.render("verify-result", {
          success: false,
          message: "Thiếu thông tin xác thực cần thiết.",
          title: "Lỗi xác thực",
        });
      }

      const user = await userModel.findOne({ email, verifyToken: token });

      if (!user) {
        return res.render("verify-result", {
          success: false,
          message: "Mã xác thực không hợp lệ hoặc đã hết hạn.",
          title: "Xác thực thất bại",
        });
      }

      if (user.isVerified) {
        return res.render("verify-result", {
          success: true,
          message: "Tài khoản của bạn đã được xác thực trước đó rồi.",
          title: "Đã xác thực",
        });
      }

      user.isVerified = true;
      user.verifyToken = undefined;
      await user.save();

      res.render("verify-result", {
        success: true,
        message: "Chúc mừng! Tài khoản của bạn đã được xác thực thành công.",
        title: "Xác thực thành công",
      });
    } catch (error) {
      res.render("verify-result", {
        success: false,
        message: "Đã có lỗi xảy ra trong quá trình xác thực.",
        title: "Lỗi hệ thống",
      });
    }
  },
  // Quên mật khẩu - gửi OTP qua email
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập email" });
      }

      const user = await userModel.findOne({ email: email.toLowerCase(), isDeleted: false });

      // Luôn trả về thành công để tránh lộ thông tin tài khoản
      if (!user) {
        return res.status(200).json({
          success: true,
          message: "Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi trong vài giây.",
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Tài khoản chưa được xác thực email. Vui lòng xác thực trước.",
        });
      }

      // Tạo OTP 6 số
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Hash OTP trước khi lưu vào DB (bảo mật)
      const hashedOtp = await bcrypt.hash(otp, 10);

      // Lưu OTP hash và thời hạn 10 phút
      user.resetPasswordOtp = hashedOtp;
      user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      // Gửi email chứa OTP
      const mailOptions = {
        from: '"Website BuildPC Checker" <lookatwidget@gmail.com>',
        to: user.email,
        subject: "Mã OTP đặt lại mật khẩu",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #1a1a2e; padding: 24px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0;">🔐 Đặt lại mật khẩu</h2>
              <p style="color: #a0a0b0; margin: 8px 0 0;">BuildPC Checker</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #333; font-size: 15px;">Xin chào <strong>${user.firstname} ${user.lastname}</strong>,</p>
              <p style="color: #555; font-size: 14px;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Sử dụng mã OTP bên dưới:</p>
              <div style="background-color: #f4f6ff; border: 2px dashed #4f46e5; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; color: #888; letter-spacing: 1px; text-transform: uppercase;">MÃ OTP CỦA BẠN</p>
                <h1 style="margin: 8px 0 0; font-size: 42px; letter-spacing: 10px; color: #4f46e5; font-weight: 900;">${otp}</h1>
              </div>
              <p style="color: #e53e3e; font-size: 13px; text-align: center;">⏳ Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px; text-align: center;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.<br/>Tài khoản của bạn vẫn an toàn.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        success: true,
        message: "Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi trong vài giây.",
      });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Đặt lại mật khẩu bằng OTP
  resetPassword: async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp đầy đủ email, mã OTP và mật khẩu mới",
        });
      }

      const user = await userModel
        .findOne({
          email: email.toLowerCase(),
          isDeleted: false,
          resetPasswordOtpExpires: { $gt: new Date() }, // còn hạn
        })
        .select("+password");

      if (!user || !user.resetPasswordOtp) {
        return res.status(400).json({
          success: false,
          message: "Mã OTP không hợp lệ hoặc đã hết hạn",
        });
      }

      // Kiểm tra OTP
      const isOtpValid = await bcrypt.compare(otp, user.resetPasswordOtp);
      if (!isOtpValid) {
        return res.status(400).json({
          success: false,
          message: "Mã OTP không hợp lệ hoặc đã hết hạn",
        });
      }

      // Hash mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Cập nhật mật khẩu và xóa OTP
      user.password = hashedPassword;
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      // Vô hiệu hóa tất cả refresh token hiện tại
      user.refreshToken = undefined;
      user.lastLogoutAt = new Date();
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
      });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = AuthenticationController;
