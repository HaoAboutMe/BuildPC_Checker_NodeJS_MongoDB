# 🖥️ BuildPC Checker - NodeJS & MongoDB

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)

> Một hệ thống Backend mạnh mẽ hỗ trợ xây dựng cấu hình máy tính cá nhân, kiểm tra độ tương thích phần cứng và gợi ý tối ưu hóa hiệu suất.

---

## 🚀 Tính Năng Chính

*   **🔍 Kiểm tra tương thích (Compatibility Check):**
    *   Kiểm tra Socket giữa CPU & Mainboard.
    *   Kiểm tra chuẩn RAM (DDR4/DDR5), Bus RAM tối đa và số lượng khe cắm.
    *   Kiểm tra kích thước vật lý (Chiều dài VGA, Chiều cao tản nhiệt so với Case).
    *   Kiểm tra số lượng cổng kết nối (Sata, M2) và khay ổ cứng trên Case.
*   **⚡ Gợi ý công suất nguồn (PSU Recommendation):** Tự động tính toán tổng TDP và đề xuất mức công suất nguồn an toàn.
*   **⚠️ Cảnh báo tối ưu (Smart Warnings):**
    *   Cảnh báo Single Channel nếu chỉ dùng 1 thanh RAM.
    *   Cảnh báo Bus RAM chưa đạt mức tối ưu cho DDR4/DDR5.
    *   Cảnh báo giảm tốc độ PCIe nếu mainboard hỗ trợ chuẩn thấp hơn VGA.
*   **💾 Quản lý cấu hình (Build Management):** Cho phép người dùng lưu trữ, cập nhật và quản lý các bộ máy đã xây dựng sau khi đăng nhập.
*   **📚 Tài liệu API trực quan:** Tích hợp Swagger UI giúp việc thử nghiệm và tích hợp Frontend trở nên dễ dàng.

---

## 🛠️ Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Runtime** | Node.js |
| **Web Framework** | Express.js |
| **Database** | MongoDB & Mongoose |
| **Xác thực** | JWT (JSON Web Token) & Bcrypt |
| **Tài liệu** | Swagger (swagger-jsdoc & swagger-ui-express) |
| **Tiện ích** | Dotenv, Morgan, Multer, Nodemailer, Express-validator |

---

## ⚙️ Cấu Hình Ban Đầu

Trước khi chạy dự án, bạn cần tạo file `.env` tại thư mục gốc và cấu hình các thông số sau:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/BuildPC_Checker
JWT_SECRET=your_super_secret_key
# Cấu hình Mail nếu cần dùng tính năng gửi mail
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🏃 Cách Chạy Dự Án

1.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```

2.  **Khởi động server (Chế độ phát triển):**
    ```bash
    npm start
    ```
    *Dự án sử dụng `nodemon` để tự động khởi động lại khi có thay đổi code.*

3.  **Dữ liệu mẫu (Seed):** Hệ thống sẽ tự động chạy script seed để tạo các thực thể hỗ trợ và linh kiện mẫu khi kết nối MongoDB lần đầu.

---

## 📖 Tài Liệu API

Sau khi server khởi động thành công, bạn có thể truy cập vào đường dẫn sau để xem tài liệu API đầy đủ và dùng thử các endpoint:

🔗 **Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 📁 Cấu Trúc Thư Mục

```text
├── bin/              # Entry point của ứng dụng
├── controllers/      # Xử lý logic nghiệp vụ cho các API
├── routes/           # Định nghĩa các endpoint (Auth, Components, Builds,...)
├── schemas/          # Mongoose Models & Schemas
├── services/         # Logic xử lý phức tạp (Tính toán tương thích, Build service)
├── utils/            # Các tiện ích (Auth middleware, Swagger config, Seeder)
└── app.js            # Cấu hình chính của Express app
```

---

## 📄 License & Contact

Dự án được phát triển nhằm mục đích học tập và hỗ trợ cộng đồng yêu công nghệ. 
📧 Liên hệ: `nguyenlehoanhao2004@email.com`

---
*Cảm ơn bạn đã quan tâm đến dự án!* 🌟
