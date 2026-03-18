# 🖥️ BuildPC Checker — NodeJS & MongoDB

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)

> Một hệ thống Backend mạnh mẽ hỗ trợ xây dựng cấu hình máy tính cá nhân, kiểm tra độ tương thích phần cứng và gợi ý tối ưu hóa hiệu suất.

---

## 🚀 Tính Năng Chính

### 🔐 Xác thực & Tài khoản
- Đăng ký tài khoản với xác thực email (gửi link qua Gmail).
- Đăng nhập bằng **Username hoặc Email**, trả về Access Token (15 phút) + Refresh Token (7 ngày).
- Làm mới Access Token qua Refresh Token mà không cần đăng nhập lại.
- Đăng xuất an toàn — vô hiệu hoá Refresh Token ngay tức thì.
- **Quên mật khẩu:** Gửi **mã OTP 6 số** (hết hạn sau 10 phút) về email để đặt lại mật khẩu.

### 🔍 Kiểm tra tương thích (Compatibility Check)
- Kiểm tra Socket giữa CPU & Mainboard.
- Kiểm tra chuẩn RAM (DDR4/DDR5), Bus RAM tối đa và số lượng khe cắm.
- Kiểm tra kích thước vật lý (chiều dài VGA, chiều cao tản nhiệt so với Case).
- Kiểm tra số lượng cổng kết nối (SATA, M.2) và khay ổ cứng trên Case.

### ⚡ Gợi ý công suất nguồn (PSU Recommendation)
- Tự động tính toán tổng TDP của toàn bộ linh kiện và đề xuất mức công suất nguồn an toàn.

### ⚠️ Cảnh báo tối ưu (Smart Warnings)
- Cảnh báo Single Channel nếu chỉ dùng 1 thanh RAM.
- Cảnh báo Bus RAM chưa đạt mức tối ưu cho DDR4/DDR5.
- Cảnh báo giảm tốc độ PCIe nếu mainboard hỗ trợ chuẩn thấp hơn VGA.

### ⚖️ Kiểm tra nghẽn cổ chai (Bottleneck Checker)
- Phân tích sự cân bằng giữa CPU và GPU dựa trên điểm Benchmark (PassMark).
- Tính toán bottleneck với trọng số riêng biệt cho: **1080p, 1440p (2K), 4K**.
- Đưa ra cảnh báo và lời khuyên nâng cấp chuyên sâu.

### 💾 Quản lý cấu hình (Build Management)
- Lưu trữ, xem, cập nhật và xóa (soft delete) các bộ máy đã xây dựng.
- Không cho phép lưu cấu hình trùng tên trong cùng một tài khoản.
- Chỉ lưu được cấu hình đã qua kiểm tra tương thích thành công.

### 📚 Tài liệu API
- Tích hợp **Swagger UI** để xem và thử nghiệm API trực tiếp trên trình duyệt.

---

## 🛠️ Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Runtime** | Node.js |
| **Web Framework** | Express.js |
| **Database** | MongoDB & Mongoose |
| **Xác thực** | JWT (Access + Refresh Token) & Bcrypt |
| **Email** | Nodemailer (Gmail SMTP) |
| **Tài liệu** | Swagger (swagger-jsdoc & swagger-ui-express) |
| **Tiện ích** | Dotenv, Morgan, Multer, Express-validator, Cors |

---

## ⚙️ Cấu Hình Ban Đầu

Tạo file `.env` tại thư mục gốc với nội dung sau:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/BuildPC_Checker
JWT_SECRET=your_super_secret_key

# Cấu hình Gmail (dùng App Password, không phải mật khẩu thường)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🏃 Cách Chạy Dự Án

**1. Cài đặt dependencies:**
```bash
npm install
```

**2. Khởi động server (chế độ phát triển):**
```bash
npm start
```
> Dự án dùng `nodemon` — tự động khởi động lại khi có thay đổi code.

**3. Seed dữ liệu mẫu:** Hệ thống tự động chạy script seed khi kết nối MongoDB lần đầu để tạo các role và dữ liệu hỗ trợ.

---

## 📖 Tài Liệu API

Sau khi server khởi động, truy cập Swagger UI tại:

🔗 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

---

## 🗂️ Các Endpoint Chính

### 🔐 Auth — `/auth`

| Method | Endpoint | Mô tả | Auth |
| :---: | :--- | :--- | :---: |
| `POST` | `/auth/register` | Đăng ký tài khoản, gửi email xác thực | ❌ |
| `GET` | `/auth/verify-email` | Xác thực email qua link | ❌ |
| `POST` | `/auth/login` | Đăng nhập, nhận Access & Refresh Token | ❌ |
| `POST` | `/auth/refresh-token` | Làm mới Access Token | ❌ |
| `POST` | `/auth/logout` | Đăng xuất, vô hiệu hoá Refresh Token | ❌ |
| `POST` | `/auth/forgot-password` | Gửi mã OTP 6 số về email (hết hạn 10 phút) | ❌ |
| `POST` | `/auth/reset-password` | Đặt lại mật khẩu bằng OTP | ❌ |

#### Flow quên mật khẩu:
```
1. POST /auth/forgot-password   { email }
   → Server gửi OTP 6 số về Gmail

2. POST /auth/reset-password    { email, otp, newPassword }
   → Đặt lại mật khẩu thành công, buộc đăng nhập lại
```

---

### ⚙️ PC Components — `/api/v1/pc-components`

| Method | Endpoint | Mô tả |
| :---: | :--- | :--- |
| `GET` | `/api/v1/pc-components/{type}` | Lấy danh sách linh kiện theo loại (cpu, ram, vga, ...) |
| `GET` | `/api/v1/pc-components/{type}/{id}` | Chi tiết một linh kiện |

---

### 🔧 Builds — `/api/v1/builds`

| Method | Endpoint | Mô tả | Auth |
| :---: | :--- | :--- | :---: |
| `POST` | `/api/v1/builds/check-compatibility` | Kiểm tra tương thích + gợi ý PSU | ❌ |
| `POST` | `/api/v1/builds/check-bottleneck` | Kiểm tra bottleneck CPU vs GPU | ❌ |
| `POST` | `/api/v1/builds/save-build` | Lưu cấu hình PC | ✅ |
| `GET` | `/api/v1/builds/my-builds` | Danh sách cấu hình của tôi | ✅ |
| `GET` | `/api/v1/builds/my-builds/:id` | Chi tiết một cấu hình | ✅ |
| `PUT` | `/api/v1/builds/my-builds/:id` | Cập nhật cấu hình | ✅ |
| `DELETE` | `/api/v1/builds/my-builds/:id` | Xóa cấu hình (soft delete) | ✅ |

---

## 📁 Cấu Trúc Thư Mục

```text
├── bin/              # Entry point của ứng dụng (www)
├── controllers/      # Xử lý logic tầng HTTP
│   ├── authenticationController.js
│   ├── buildController.js
│   └── ...
├── routes/           # Định nghĩa endpoints & Swagger docs
│   ├── auth.js
│   ├── builds.js
│   └── ...
├── schemas/          # Mongoose Models & Schemas
│   ├── user.js
│   ├── build.js
│   └── ...
├── services/         # Logic nghiệp vụ phức tạp
│   ├── buildService.js
│   ├── bottleneckService.js
│   └── compatibility/
├── utils/            # Tiện ích (Auth middleware, Swagger, Seeder)
└── app.js            # Cấu hình chính của Express app
```

---

## 📄 License & Contact

Dự án được phát triển nhằm mục đích học tập và hỗ trợ cộng đồng yêu công nghệ.

📧 Liên hệ: `nguyenlehoanhao2004@email.com`

---
*Cảm ơn bạn đã quan tâm đến dự án!* 🌟
