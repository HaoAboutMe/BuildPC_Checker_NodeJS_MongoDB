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

## 2. Socket.io (Tương tác thời gian thực)

Vì đây là website hỗ trợ build và kiểm tra tương thích, Socket.io sẽ tập trung vào vai trò cầu nối trực tiếp giữa **Người dùng** và **Quản trị viên (Admin)** để cải thiện chất lượng dữ liệu linh kiện.

### Hướng đi cụ thể:
*   **Góp ý nhanh (User Feedback Hub):**
    - Người dùng có thể nhấn nút "Cần hỗ trợ" hoặc "Báo cáo thông số sai" ngay tại giao diện build PC.
    - Một hộp thoại nhỏ hiện ra cho phép gửi tin nhắn kèm theo cấu hình hiện tại đang build.
    - **Lợi ích:** Admin nhận được thông báo tức thời, từ đó kịp thời kiểm tra và sửa đổi các thông số linh kiện bị sai lệch (ví dụ: chân cắm RAM sai, công suất nguồn chưa chuẩn) dựa trên phản ánh trực tiếp từ người dùng.

### Các bước thực hiện:
1.  **Cài đặt:** `npm install socket.io`
2.  **Khởi tạo:** Tích hợp vào `bin/www` để chạy cùng cổng với server Express.
3.  **Tạo Socket Service:** Quản lý sự kiện gửi phản hồi (`send-feedback`) từ client và đẩy về giao diện của Admin.

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
