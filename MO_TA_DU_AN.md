# Mô tả Dự án BuildPC Checker Backend

## 1. Tổng quan
Dự án **BuildPC Checker** là một hệ thống backend được xây dựng trên nền tảng **Node.js** và **Express**, sử dụng **MongoDB** làm cơ sở dữ liệu chính. Hệ thống cung cấp các API để quản lý linh kiện máy tính, hỗ trợ người dùng xây dựng cấu hình PC, kiểm tra tính tương thích giữa các linh kiện và cung cấp tính năng diễn đàn, chat trực tuyến.

## 2. Công nghệ sử dụng
- **Ngôn ngữ**: JavaScript (Node.js)
- **Framework**: Express.js
- **Cơ sở dữ liệu**: MongoDB (Mongoose ODM)
- **Xác thực**: JSON Web Token (JWT)
- **Tài liệu API**: Swagger UI
- **Giao diện (Views)**: Handlebars (hbs) - sử dụng cho các trang lỗi hoặc dashboard đơn giản.
- **Tiện ích**: 
  - `express-validator`: Xác thực dữ liệu đầu vào.
  - `multer`: Xử lý tải lên tệp tin.
  - `xlsx`: Đọc/Xuất dữ liệu linh kiện từ file Excel.
  - `socket.io`: Hỗ trợ chat realtime.

## 3. Cấu trúc thư mục
Dự án được tổ chức theo mô hình MVC (Model-View-Controller) giúp tách biệt logic và định tuyến:
- `/controllers`: Chứa logic xử lý nghiệp vụ cho từng module (Chat, Build, User, PC Components...).
- `/routes`: Định nghĩa các endpoints của API. Các routes này thường chỉ gọi đến controller tương ứng.
- `/schemas`: Định nghĩa cấu trúc dữ liệu cho MongoDB (Mongoose Models).
- `/services`: Các dịch vụ bổ trợ như xử lý logic phức tạp hoặc tích hợp bên thứ ba.
- `/utils`: Chứa các middleware (auth, role), cấu hình swagger, và các hàm tiện ích.
- `/public`: Chứa tài liệu tĩnh, hình ảnh linh kiện.

## 4. Hệ thống Định tuyến (Routing)
Dự án sử dụng cách tiếp cận tách biệt giữa **Route** và **Controller**. Thay vì viết logic trực tiếp trong route (`req`, `res`), các tệp route chỉ định nghĩa đường dẫn và middleware, sau đó ủy quyền xử lý cho controller.

### Các Modules chính:

#### 🔐 Xác thực (Auth) - `/auth`
- Đăng ký, đăng nhập, làm mới token (`refresh-token`).
- Quản lý phân quyền (Admin/User).

#### 👤 Người dùng (Users) - `/api/v1/users`
- Lấy thông tin cá nhân, cập nhật profile.
- Quản lý danh sách người dùng (dành cho Admin).

#### 🖥️ Linh kiện PC (PC Components) - `/api/v1/pc-components`
Đây là một trong những phần đặc biệt nhất của dự án. Hệ thống tự động khởi tạo routes cho nhiều loại linh kiện khác nhau (CPU, Mainboard, RAM, VGA, SSD, HDD, PSU...) thông qua một mảng cấu hình trong `pcComponents.js`.
- `GET /cpus`, `GET /mainboards`...: Lấy danh sách linh kiện.
- `POST /import`: Import số lượng lớn linh kiện từ file Excel.
- `POST`, `PUT`, `DELETE`: Quản lý linh kiện (yêu cầu quyền Admin).

#### 🛠️ Xây dựng PC (Builds) - `/api/v1/builds`
- Lưu trữ cấu hình PC của người dùng.
- Kiểm tra tính tương thích (Compatibility Check) giữa các linh kiện được chọn.

#### 💬 Diễn đàn & Chat (Forum & Chat) - `/api/v1/forum`, `/api/v1/chat`
- Đăng bài viết, bình luận trên diễn đàn.
- Chat trực tuyến giữa các người dùng hoặc với hỗ trợ viên, hỗ trợ lấy lịch sử chat và danh sách bạn chat.

## 5. So sánh cấu trúc Routing
Để thấy rõ sự tối ưu của dự án hiện tại, hãy so sánh cách viết Route truyền thống (Sử dụng trực tiếp `req`, `res`) và cách viết Clean Route của dự án này:

### ❌ Cách viết truyền thống (Fat Routes)
Logic xử lý (`req`, `res`, database, transaction, validation...) được viết trực tiếp bên trong file Route. Điều này khiến file định tuyến trở nên rất dài, khó đọc và khó bảo trì.
```javascript
// Ví dụ Route truyền thống (KHÔNG CÓ trong dự án này)
router.post('/register', async function (req, res, next) {
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
        let { username, password, email } = req.body;
        // Logic xử lý trực tiếp ở đây...
        let newUser = await userController.CreateAnUser(username, password, email, "69b1265c", session);
        let newCArt = new cartModel({ user: newUser._id });
        await newCArt.save({ session });
        await session.commitTransaction();
        res.send(newCArt);
    } catch (error) {
        await session.abortTransaction();
        res.status(404).send({ message: error.message });
    }
});
```

### ✅ Cách viết của dự án (Clean Routes + Controllers)
Dự án tách biệt hoàn toàn Logic vào `Controller`. Các file Route chỉ làm nhiệm vụ định nghĩa đường dẫn và Middleware. Cách này giúp code vô cùng sạch sẽ và chuyên nghiệp.
```javascript
// Cách viết hiện tại trong dự án
router.post("/register", registerValidation, AuthenticationController.register);
router.post("/login", loginValidation, AuthenticationController.login);
```
*Ghi chú: Toàn bộ code xử lý logic, tương tác DB và phản hồi res.send/res.json đều được đóng gói trong thư mục `controllers/`.*

## 6. Đặc điểm nổi bật trong mã nguồn
- **Lập trình theo hướng Cấu hình (Configuration-Driven Routing)**: Các routes trong `pc-components` được khởi tạo tự động bằng vòng lặp, giúp giảm thiểu mã nguồn trùng lặp.
- **Tính đóng gói cao**: Mỗi module có Controller riêng biệt, giúp việc debug và mở rộng trở nên dễ dàng.
- **Tích hợp Excel**: Xử lý dữ liệu lớn thông qua file Excel (`xlsx`), hỗ trợ import linh kiện hàng loạt.
- **Bảo mật**: Sử dụng middleware để bảo vệ các API quan trọng bằng JWT và kiểm tra vai trò người dùng (Roles).

---
*Tài liệu này mô tả chi tiết về cấu trúc và hệ thống backend hiện tại của dự án.*
