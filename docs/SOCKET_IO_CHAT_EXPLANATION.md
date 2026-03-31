# Hướng dẫn Hoạt động Socket.io Chat (Backend)

Tài liệu này mô tả chi tiết cách hệ thống Chat thời gian thực (Real-time) được triển khai trên Backend sử dụng **Socket.io** trong dự án này.

## 1. Kiến trúc Tổng quan

Hệ thống Chat dựa trên mô hình **Event-driven** (hướng sự kiện). Backend đóng vai trò là trung tâm điều phối tin nhắn giữa các người dùng thông qua các "Room" (phòng chat) riêng biệt.

- **File cấu hình:** `utils/socket.js`
- **Công nghệ:** Socket.io, JWT (Xác thực), Mongoose (Lưu trữ tin nhắn).

---

## 2. Các thành phần chính

### 2.1. Cơ chế Xác thực (Authentication Middleware)
Trước khi một kết nối Socket được thiết lập thành công, nó phải đi qua một lớp Middleware bảo mật:
- **Token:** Client gửi JWT Token thông qua `handshake.auth.token` hoặc `handshake.query.token`.
- **Xác thực:** Backend giải mã token, tìm kiếm người dùng trong Database.
- **Gán thông tin:** Nếu hợp lệ, đối tượng người dùng (`user`) sẽ được gắn trực tiếp vào `socket.user` để sử dụng trong tất cả các sự kiện sau đó.

### 2.2. Quản lý Phòng Chat (Room Management)
Dự án sử dụng cơ chế **Phòng chat 1-1** (Private Room).
- **Quy tắc đặt tên (Room Name):** Để đảm bảo hai người dùng luôn vào đúng một phòng duy nhất, tên phòng được tạo bằng cách sắp xếp 2 User ID theo bảng chữ cái và nối lại bằng dấu gạch dưới (`_`).
  *Ví dụ: Người dùng A (`id: 123`) và B (`id: 456`) sẽ luôn vào phòng `123_456`.*
- **Sự kiện `join_chat`:** Khi người dùng mở khung chat với ai đó, Client gửi sự kiện này để Backend đưa Socket vào phòng tương ứng.

---

## 3. Quy trình Xử lý Sự kiện (Events Flow)

### 3.1. Gửi và Nhận tin nhắn (`send_message` -> `receive_message`)
1. **Nhận tin từ Client:** Client phát sự kiện `send_message` kèm theo `receiverId` và `content`.
2. **Lưu Database:** Backend lưu tin nhắn vào collection `chat-messages` (Schema: `sender`, `receiver`, `content`, `timestamps`).
3. **Làm giàu dữ liệu (Populate):** Backend sử dụng `.populate()` để lấy thêm thông tin như `username` người gửi/nhận và thông tin linh kiện liên quan (nếu có).
4. **Phát tán (Emit):** Sử dụng `io.to(roomName).emit('receive_message', newMessage)` để gửi tin nhắn mới cho **tất cả** thành viên trong phòng đó.

### 3.2. Trạng thái Đang nhập chữ (`typing`)
1. **Gửi:** Khi người dùng gõ phím, Client gửi `typing` kèm `isTyping: true`.
2. **Phát tin:** Backend sử dụng `socket.to(roomName).emit('user_typing', ...)` để báo cho **những người khác** trong phòng (trừ người đang gõ) biết để hiển thị hiệu ứng "..." trên UI.

### 3.3. Ngắt kết nối (`disconnect`)
- Khi người dùng đóng trình duyệt hoặc mất mạng, sự kiện này được kích hoạt để thực hiện dọn dẹp hoặc thông báo trạng thái offline (nếu cần mở rộng).

---

## 4. Danh sách các Sự kiện Socket

| Event (Từ Client) | Payload (Dữ liệu gửi lên) | Mô tả |
| :--- | :--- | :--- |
| `join_chat` | `{ targetUserId: string }` | Tham gia phòng chat riêng với người dùng mục tiêu. |
| `send_message` | `{ receiverId, content, relatedBuildId? }` | Gửi tin nhắn mới. |
| `typing` | `{ targetUserId, isTyping: boolean }` | Thông báo trạng thái đang soạn văn bản. |

| Event (Từ Server) | Payload (Dữ liệu trả về) | Mô tả |
| :--- | :--- | :--- |
| `joined_chat` | `{ room, targetUserId }` | Xác nhận đã vào phòng thành công. |
| `receive_message` | `{ _id, sender, content, ... }` | Tin nhắn mới nhận được cho phòng hiện tại. |
| `user_typing` | `{ userId, isTyping }` | Thông báo có người khác đang gõ phím. |
| `error_message` | `{ message: string }` | Thông báo lỗi khi xử lý sự kiện. |

---

## 5. Ví dụ luồng hoạt động
1. **Client A** kết nối với Token -> Backend xác thực OK.
2. **Client A** phát `join_chat` với `targetUserId: B`.
3. **Client A** phát `send_message` -> Backend lưu DB -> Backend phát `receive_message` tới cả A và B.
4. **Client B** nhận được tin nhắn và hiển thị lên màn hình ngay lập tức mà không cần F5 trang web.
