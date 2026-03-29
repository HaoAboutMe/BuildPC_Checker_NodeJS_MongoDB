---
description: Kế hoạch triển khai Transaction, Socket và tối ưu Upload cho dự án BuildPC Checker
---

# Lộ Trình Phát Triển Hệ Thống: Transaction, Socket & Upload Optimization

Chào bạn, dựa trên cấu trúc dự án hiện tại là một hệ thông hỗ trợ xây dựng cấu hình và kiểm tra tương thích, dưới đây là hướng đi cụ thể để bạn "nâng cấp" dự án một cách chuyên nghiệp.

---

## 1. MongoDB Transactions (Đảm bảo tính nhất quán dữ liệu)

Trong một hệ thống không bán hàng, Transaction vẫn vô cùng quan trọng khi bạn thực hiện các thao tác ảnh hưởng đến nhiều Collection cùng lúc.

### Hướng đi cụ thể:

- **Tình huống 1: Lưu cấu hình Build (Save Build) & Cập nhật Metadata linh kiện.**
  - Khi một người dùng lưu một Build mới, bạn có thể muốn tăng số lượng "Lượt sử dụng" (`usageCount`) của các linh kiện đó để thống kê "Linh kiện được tin dùng nhất".
  - **Transaction:** Đảm bảo rằng nếu lưu Build thất bại thì không tăng counter, và ngược lại.
- **Tình huống 2: Xóa tài khoản người dùng (Delete User).**
  - Khi xóa một User, bạn cần xóa (hoặc ẩn) tất cả các [Builds](cci:1://file:///d:/My_Workspace/NodeJS/HUTECH_NodeJS_MongoDB/BuildPC_Checker_NodeJS_MongoDB/services/buildService.js:154:0-157:2) của User đó.
  - **Transaction:** Đảm bảo toàn bộ Builds và User đều được xử lý đồng nhất. Nếu lỗi ở một Build, lệnh xóa User sẽ bị hủy để tránh dữ liệu mồ côi.

### Các bước thực hiện:

1.  **Yêu cầu:** MongoDB của bạn phải chạy chế độ **Replica Set** (bắt buộc để dùng Transaction).
2.  **Code mẫu:**
    ```javascript
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Tạo Build mới
      const newBuild = await Build.create([buildData], { session });
      // 2. Cập nhật lượt dùng cho CPU
      await Cpu.findByIdAndUpdate(
        cpuId,
        { $inc: { usageCount: 1 } },
        { session },
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    ```

---

## 2. Socket.io (Tương tác thời gian thực & Cộng đồng)

Vì đây là website hỗ trợ build và kiểm tra tương thích có kết hợp diễn đàn (Forum), Socket.io sẽ là "linh hồn" giúp biến một trang web tĩnh thành một cộng đồng sống động thông qua việc kết hợp Forum và Chat Real-time.

### Hướng đi cụ thể:

*   **Hướng đi 2: Contextual Private Chat (Chat riêng theo bài viết)**
    - Thay vì dùng cửa sổ chat chung hỗn loạn, tính năng này gắn kết trực tiếp với bài đăng Forum.
    - **Quy trình:** Người xem ấn vào chi tiết bài viết -> Click nút "Nhắn tin cho tác giả" -> Mở hộp thoại chat riêng.
    - Hệ thống tự động gửi kèm một tin nhắn/thẻ dẫn link bài viết đó để tác giả biết người dùng đang hỏi về cấu hình cụ thể nào.
    - **Lợi ích:** Tư vấn chuyên sâu, riêng tư và dễ quản lý cho cả người hỏi và người trả lời.

*   **Hướng đi 4: Thông báo thời gian thực (Live Notifications)**
    - Thông báo đẩy (push) ngay lập tức khi có người bình luận vào bài post forum, có người rep tin nhắn chat hoặc khi admin duyệt bản build.

### Các bước thực hiện:
1.  **Cài đặt & Khởi tạo:** `npm install socket.io`. Tích hợp vào `bin/www` để dùng chung port với Express.
2.  **Thiết kế Database cho Chat:** 
    - Tạo collection `Messages` để lưu lịch sử chat (đảm bảo người vào sau vẫn xem được nội dung cũ).
    - Các trường cơ bản: `sender`, `content`, `room`, `timestamp`.
3.  **Xử lý Logic Socket:** 
    - `socket.on('join_room')`: Phân chia group chat theo chủ đề hoặc chat 1-1.
    - `socket.on('send_message')`: Lưu vào DB và phát (broadcast) tới các user trong room.
    - `socket.on('typing')`: Hiển thị hiệu ứng "ai đó đang gõ..." để trải nghiệm thật hơn.
4.  **Frontend Integration:** Sử dụng `socket.io-client` để kết nối và cập nhật UI mà không cần reload trang.

---

## 3. Tối ưu hóa Upload (Nâng cao hiệu suất & Scalability)

Hiện tại bạn đang dùng `multer` lưu file trực tiếp vào ổ cứng server. Điều này có 3 nhược điểm: tốn dung lượng server, khó scale khi có nhiều server, và load ảnh chậm vì không có CDN.

### Hướng đi cụ thể:

- **Chuyển sang Cloud Storage (Cloudinary):**
  - Sử dụng **Cloudinary** để lưu trữ ảnh linh kiện và ảnh đại diện người dùng.
  - **Lợi ích:** Tự động tối ưu dung lượng ảnh, tự động tạo thumbnail, có đường truyền CDN tốc độ cao.
- **Lazy Loading & Image Optimization:**
  - Khi upload, sử dụng thư viện `sharp` để resize ảnh về các kích thước chuẩn (small, medium, large) trước khi đẩy lên cloud.

### Các bước thực hiện:

1.  **Cài đặt:** `npm install cloudinary multer-storage-cloudinary`
2.  **Cấu hình:** Thay thế `diskStorage` bằng `CloudinaryStorage` trong [fileController.js](cci:7://file:///d:/My_Workspace/NodeJS/HUTECH_NodeJS_MongoDB/BuildPC_Checker_NodeJS_MongoDB/controllers/fileController.js:0:0-0:0).
3.  **Refactor:** Cập nhật các API upload để nhận URL từ Cloudinary thay vì path cục bộ.

---

## Bảng so sánh Trước & Sau khi nâng cấp

| Chức năng         | Hiện tại                      | Sau khi nâng cấp                               |
| :---------------- | :---------------------------- | :--------------------------------------------- |
| **Logic dữ liệu** | Xử lý rời rạc, dễ lỗi đồng bộ | **Transactions** bảo vệ toàn vẹn dữ liệu 100%  |
| **Tương tác**     | Request - Response tĩnh       | **Socket.io** thông báo tức thời, tăng UX      |
| **Lưu trữ ảnh**   | Lưu vào ổ cứng server         | **Cloudinary** lưu trữ đám mây, bảo mật, nhanh |
| **Trải nghiệm**   | Giống một web thông tin cũ    | Cảm giác chuyên nghiệp, hiện đại               |

---

Bạn có muốn tôi bắt đầu thực hiện bước đầu tiên là **Tối ưu hóa chức năng Upload bằng Cloudinary** không? Đây là bước dễ thấy kết quả nhất và giúp "dọn dẹp" gọn gàng thư mục project của bạn.
