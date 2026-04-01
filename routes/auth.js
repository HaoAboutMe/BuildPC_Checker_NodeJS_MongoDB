var express = require("express");
var router = express.Router();
const userModel = require("../schemas/user");
const roleModel = require("../schemas/role");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

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

// Middleware validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

const registerValidation = [
  body("username")
    .notEmpty()
    .withMessage("username không được để trống")
    .isLength({ min: 3 })
    .withMessage("username phải ít nhất 3 ký tự"),
  body("firstname").notEmpty().withMessage("firstname không được để trống"),
  body("lastname").notEmpty().withMessage("lastname không được để trống"),
  body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
  body("password")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Mật khẩu phải chứa ít nhất 1 ký tự viết hoa, 1 ký tự viết thường, 1 số, 1 ký tự đặc biệt và dài ít nhất 8 ký tự",
    ),
  validate,
];

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, example: "user123" }
 *               firstname: { type: string, example: "Hao" }
 *               lastname: { type: string, example: "Nguyen" }
 *               email: { type: string, example: "user@example.com" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       201:
 *         description: Registered successfully
 */
router.post("/register", registerValidation, async (req, res) => {
  try {
    const { username, firstname, lastname, email, password, dateOfBirth } =
      req.body;

    const existingUser = await userModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Username hoặc Email đã tồn tại" });
    }

    const userRole = await roleModel.findOne({ name: "user" });
    if (!userRole) {
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống: Role 'user' chưa được khởi tạo",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const newUser = new userModel({
      username,
      firstname,
      lastname,
      email,
      password: hashedPassword,
      dateOfBirth,
      role: userRole._id,
      isVerified: false,
      verifyToken,
    });

    await newUser.save();
    await newUser.populate({ path: "role", select: "name" });

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

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier: { type: string, example: "user123" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post(
  "/login",
  [
    body("identifier")
      .notEmpty()
      .withMessage("Username hoặc Email không được để trống"),
    body("password").notEmpty().withMessage("Password không được để trống"),
    validate,
  ],
  async (req, res) => {
    try {
      const { identifier, password } = req.body;

      const user = await userModel
        .findOne({
          $or: [{ email: identifier }, { username: identifier }],
        })
        .populate("role")
        .select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Thông tin đăng nhập không chính xác",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Thông tin đăng nhập không chính xác",
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Vui lòng xác thực email trước khi đăng nhập",
        });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

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
);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification token sent to users email
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
router.get("/verify-email", async (req, res) => {
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
});

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string, example: "your_refresh_token_here" }
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh Token là bắt buộc" });
    }

    const user = await userModel.findOne({ refreshToken }).populate("role");
    if (!user) {
      return res
        .status(403)
        .json({ success: false, message: "Refresh Token không hợp lệ" });
    }

    try {
      jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Refresh Token đã hết hạn hoặc không hợp lệ",
      });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

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
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", async (req, res) => {
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
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Gửi mã OTP đặt lại mật khẩu về email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP đã được gửi (hoặc email không tồn tại - không tiết lộ)
 */
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(), validate],
  async (req, res) => {
    try {
      const { email } = req.body;
      const user = await userModel.findOne({ email: email.toLowerCase(), isDeleted: false });

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

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);

      user.resetPasswordOtp = hashedOtp;
      user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

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
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng mã OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: OTP không hợp lệ hoặc đã hết hạn
 */
router.post(
  "/reset-password",
  [
    body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
    body("otp").notEmpty().withMessage("Mã OTP không được để trống"),
    body("newPassword")
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage(
        "Mật khẩu mới phải chứa ít nhất 1 ký tự viết hoa, 1 ký tự viết thường, 1 số, 1 ký tự đặc biệt và dài ít nhất 8 ký tự"
      ),
    validate,
  ],
  async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      const user = await userModel
        .findOne({
          email: email.toLowerCase(),
          isDeleted: false,
          resetPasswordOtpExpires: { $gt: new Date() },
        })
        .select("+password");

      if (!user || !user.resetPasswordOtp) {
        return res.status(400).json({
          success: false,
          message: "Mã OTP không hợp lệ hoặc đã hết hạn",
        });
      }

      const isOtpValid = await bcrypt.compare(otp, user.resetPasswordOtp);
      if (!isOtpValid) {
        return res.status(400).json({
          success: false,
          message: "Mã OTP không hợp lệ hoặc đã hết hạn",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      user.refreshToken = undefined;
      user.lastLogoutAt = new Date();
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
