# Project Endpoints and API Specifications

Tài liệu này cung cấp danh sách đầy đủ các API endpoint của dự án, phân loại theo tính năng, kèm theo mô tả về Request payload và cấu trúc Response trả về (dựa vào spec Swagger/Validation).

---

## 1. Authentication / Xác thực và Ủy quyền (`/auth`)
**Chức năng:** Quản lý phiên làm việc, cấp/thu hồi Token, mật khẩu.

### `POST /auth/register` - Đăng ký
- **Request:**
  ```json
  {
    "username": "user123",
    "firstname": "Hao",
    "lastname": "Nguyen",
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201 Created):**
  ```json
  { "success": true, "message": "Đăng ký thành công", "data": { "_id": "...", ... } }
  ```

### `POST /auth/login` - Đăng nhập
- **Request:**
  ```json
  {
    "identifier": "user123", // hoặc email
    "password": "Password123!"
  }
  ```
- **Response:**
  ```json
  { 
    "success": true, 
    "data": { "token": "ey...", "refreshToken": "ey...", "user": { ... } }
  }
  ```

### `GET /auth/verify-email` - Xác nhận Email
- **Request:** Query `?token=abc...`
- **Response:**
  ```json
  { "success": true, "message": "Xác thực email thành công" }
  ```

### `POST /auth/refresh-token` - Làm mới Auth Token
- **Request:**
  ```json
  { "refreshToken": "ey..." }
  ```
- **Response:**
  ```json
  { "success": true, "data": { "accessToken": "ey..." } }
  ```

### `POST /auth/forgot-password` - Gửi OTP Quên Mật Khẩu
- **Request:**
  ```json
  { "email": "user@example.com" }
  ```
- **Response:**
  ```json
  { "success": true, "message": "OTP đã được gửi..." }
  ```

### `POST /auth/reset-password` - Đặt Lại Mật Khẩu với OTP
- **Request:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewPassword123!"
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Đặt lại mật khẩu thành công" }
  ```

---

## 2. Users / Quản trị tài khoản (`/api/v1/users`)

### `GET /api/v1/users/me` - Profile Cá Nhân
- **Request:** Header: `Authorization: Bearer <Token>`
- **Response:**
  ```json
  { "success": true, "data": { "username": "user123", "email": "...", "role": "..." } }
  ```

### `PUT /api/v1/users/me` - Cập Nhật Profile
- **Request:**
  ```json
  {
    "firstname": "Updated Firstname",
    "lastname": "Updated Lastname",
    "dateOfBirth": "1995-01-01"
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Cập nhật thành công", "data": { ... } }
  ```

### `PUT /api/v1/users/me/change-password` - Đổi Mật Khẩu
- **Request:**
  ```json
  {
    "oldPassword": "CurrentPassword123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Đổi mật khẩu thành công" }
  ```

*(Các endpoint GET/PUT/DELETE trên `/api/v1/users` và `/api/v1/users/role/:roleId` dành cho Admin trả về mảng danh sách người dùng chuẩn hoặc Cập nhật `roleId` object)*

---

## 3. Support Entities / Danh mục Hỗ Trợ (`/api/v1/support-entities`)
*(Áp dụng cho các entity: `sockets`, `ram-types`, `pcie-versions`, `form-factors`...)*

### CRUD Chuẩn:
- **`GET /{entity}`**: Trả về `[ {"_id": "...", "name": "LGA 1700"} ]`
- **`POST /{entity}`** & **`PUT /{entity}/:id`**: 
  - **Request:** `{ "name": "Chuẩn mới" }`
  - **Response:** `{ "success": true, "data": { "_id": "...", "name": "Chuẩn mới" } }`
- **`DELETE /{entity}/:id`**:
  - **Response:** `{ "success": true, "message": "Xóa thành công" }`

---

## 4. PC Components / Linh kiện máy tính (`/api/v1/pc-components`)
*(Áp dụng cho: `cpus`, `mainboards`, `rams`, `vgas`, `ssds`, `hdds`, `psus`, `pc-cases`, `coolers`)*

### Lấy danh sách hoặc xem chi tiết (`GET /{component}` & `GET /{component}/:id`)
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65f...",
        "name": "Intel Core i5-12400F",
        "socket": { "_id": "...", "name": "LGA 1700" },
        "tdp": 65,
        "score": 19000,
        "imageUrl": "..."
      }
    ]
  }
  ```

### Tạo mới / Cập nhật (`POST /{component}` & `PUT /{component}/:id`)
- **Request Example (Dành cho CPU):**
  ```json
  {
    "name": "Intel Core i5-12400F",
    "socket": "65f...", // ObjectId của Socket Hỗ trợ
    "vrmMin": 4,
    "igpu": false,
    "tdp": 65,
    "pcieVersion": "65f...",
    "score": 19000,
    "imageUrl": "https://..."
  }
  ```
- **Response:** Trả về đối tượng vừa lưu thành công.

---

## 5. Builds / Công cụ PC Build (`/api/v1/builds`)

### `POST /api/v1/builds/check-compatibility` - Kiểm tra Tương Thích
- **Request:**
  ```json
  {
    "cpuId": "65cb...",
    "mainboardId": "65cb...",
    "ramId": "65cb...",
    "ramQuantity": 2,
    "vgaId": "65cb...",
    "ssdIds": ["65cb..."],
    "hddIds": [],
    "psuId": "65cb...",
    "caseId": "65cb...",
    "coolerId": "65cb..."
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "compatible": false,
      "errors": ["Mainboard không hỗ trợ Socket của CPU."],
      "warnings": ["PSU công suất thấp hơn mức độ khuyến nghị."],
      "recommendedPsuWattage": 550
    }
  }
  ```

### `POST /api/v1/builds/check-bottleneck` - Kiểm tra Nghẽn Cổ Chai
- **Request:**
  ```json
  {
    "cpuId": "65cb...",
    "vgaId": "65cb..."
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "cpu": { "name": "Intel Core i5-12400F", "score": 19000 },
      "gpu": { "name": "RTX 4060", "score": 15000 },
      "results": {
        "1080p": { "bottleneck": true, "type": "CPU", "severity": "MEDIUM", "ratio": 15.5, "message": "CPU có nguy cơ nghẽn." },
        "2k": { "bottleneck": false, "type": "NONE", "severity": "NONE", "ratio": 2.1, "message": "Cấu hình hoạt động tốt." },
        "4k": { ... }
      }
    }
  }
  ```

### `POST /api/v1/builds/save-build` - Lưu cấu hình Build của tài khoản
- **Request:**
  ```json
  {
    "name": "Cấu hình Gaming 2024",
    "description": "Cấu hình tối ưu 1080p",
    "cpuId": "65cb...",
    "mainboardId": "65cb...",
    "ramQuantity": 2
    // ... Danh sách linh kiện tương tự check-compatibility
  }
  ```
- **Response:** `{ "success": true, "data": { ...savedBuildData } }`

---

## 6. Forum / Diễn đàn Chia sẻ (`/api/v1/forum`)

### `POST /api/v1/forum/shared-builds` - Chia sẻ Build
- **Request:**
  ```json
  {
    "buildId": "65cb...", // ID của bản build đã lưu
    "title": "Build AI 30 củ!",
    "content": "Đây là thông số máy bộ AI..."
  }
  ```
- **Response:** `{ "success": true, "data": { ...forumPostData } }`

### `POST /api/v1/forum/shared-builds/:id/toggle-like` - Thả Tym
- **Request:** *Không Body* (Xác thực bằng token người dùng)
- **Response:** `{ "success": true, "message": "Đã Thích / Đã Bỏ Thích" }`

### `POST /api/v1/forum/shared-builds/:id/comments` - Bình luận
- **Request:**
  ```json
  { "text": "Cấu hình xịn quá ad ơi!" }
  ```
- **Response:** `{ "success": true, "data": { "text": "...", "user": "..." } }`

---

## 7. Chat / Tin nhắn Trực tiếp (`/api/v1/chat`)

### `GET /api/v1/chat/contacts` - Danh bạ Chat
- **Request:** *Header Bearer Token*
- **Response:**
  ```json
  {
    "success": true,
    "data": [
       { "userId": "...", "username": "admin123", "lastMessage": "Chào bạn", "timestamp": "2024-..." }
    ]
  }
  ```

### `GET /api/v1/chat/history/:withUserId` - Lịch sử trò chuyện
- **Request:** Query `?page=1&limit=20`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      { "senderId": "...", "receiverId": "...", "message": "Hi", "createdAt": "..." }
    ]
  }
  ```

---

## 8. File Management (`/api/v1/files`)

### `POST /api/v1/files/upload` - Upload Ảnh tĩnh
- **Request:** Form-Data (`multipart/form-data`)
  - `image`: *(File Binary)*
- **Response:**
  ```json
  {
    "success": true,
    "url": "https://res.cloudinary.com/.../image.webp"
  }
  ```
