# Mô tả các API Endpoint - Builds

Tài liệu này mô tả chi tiết các chức năng của các API endpoint thuộc phân đoạn **Builds (PC Build compatibility and optimization)** như trong hình ảnh cung cấp.

## Danh sách Endpoint

| Phương thức | Endpoint | Mô tả chức năng | Xác thực |
| :--- | :--- | :--- | :---: |
| **POST** | `/api/v1/builds/check-compatibility` | Kiểm tra tương thích phần cứng và gợi ý PSU | Không |
| **POST** | `/api/v1/builds/check-bottleneck` | Kiểm tra nghẽn cổ chai (Bottleneck) CPU và GPU | Không |
| **POST** | `/api/v1/builds/save-build` | Lưu cấu hình PC của người dùng | **Có** |
| **GET** | `/api/v1/builds/my-builds` | Lấy danh sách các cấu hình đã lưu của tôi | **Có** |
| **GET** | `/api/v1/builds/my-builds/{id}`| Xem chi tiết một cấu hình cụ thể theo ID | **Có** |
| **PUT** | `/api/v1/builds/my-builds/{id}`| Cập nhật thông tin cấu hình đã lưu | **Có** |
| **DELETE** | `/api/v1/builds/my-builds/{id}`| Xóa một cấu hình khỏi danh sách của tôi | **Có** |

---

## Chi tiết từng Endpoint

### 1. Kiểm tra tương thích phần cứng
- **Endpoint:** `POST /api/v1/builds/check-compatibility`
- **Chức năng:** Nhận danh sách các linh kiện (CPU, Mainboard, RAM, VGA, PSU...) và kiểm tra xem chúng có tương thích với nhau không (ví dụ: khớp socket, chuẩn RAM, kích thước case...). Ngoài ra, hệ thống sẽ tính toán và gợi ý mức công suất nguồn (PSU) phù hợp.
- **Dữ liệu yêu cầu (Request Body):**
  ```json
  {
    "cpuId": "65cb7e...",
    "mainboardId": "65cb7f...",
    "ramId": "65cb80...",
    "ramQuantity": 2,
    "vgaId": "65cb81...",
    "ssdIds": ["65cb82..."],
    "hddIds": [],
    "psuId": "65cb83...",
    "caseId": "65cb84...",
    "coolerId": "65cb85..."
  }
  ```
- **Kết quả trả về (Response):**
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

### 2. Kiểm tra nghẽn cổ chai
- **Endpoint:** `POST /api/v1/builds/check-bottleneck`
- **Chức năng:** Phân tích sự cân đối giữa CPU và GPU để xác định xem linh kiện nào đang làm giảm hiệu năng tổng thể của hệ thống.
- **Dữ liệu yêu cầu (Request Body):**
  ```json
  {
    "cpuId": "65cb7e...",
    "vgaId": "65cb81..."
  }
  ```
- **Kết quả trả về (Response):**
  ```json
  {
    "success": true,
    "data": {
      "cpu": { "name": "Intel Core i5-12400F", "score": 19000 },
      "gpu": { "name": "RTX 4060", "score": 15000 },
      "results": {
        "1080p": { "bottleneck": true, "type": "CPU", "severity": "MEDIUM", "ratio": 15.5, "message": "CPU có nguy cơ nghẽn." },
        "2k": { "bottleneck": false, "type": "NONE", "severity": "NONE", "ratio": 2.1, "message": "Cấu hình hoạt động tốt." },
        "4k": { "bottleneck": false, "type": "NONE", "severity": "NONE", "ratio": 1.5, "message": "Cấu hình hoạt động tốt." }
      }
    }
  }
  ```

### 3. Lưu cấu hình PC
- **Endpoint:** `POST /api/v1/builds/save-build`
- **Chức năng:** Cho phép người dùng đã đăng nhập lưu lại bộ cấu hình họ vừa xây dựng vào tài khoản cá nhân.
- **Dữ liệu yêu cầu (Request Body):**
  ```json
  {
    "name": "Cấu hình Gaming 2024",
    "description": "Cấu hình tối ưu 1080p",
    "cpuId": "65cb7e...",
    "mainboardId": "65cb7f...",
    "ramId": "65cb80...",
    "ramQuantity": 2,
    "vgaId": "65cb81...",
    "ssdIds": ["65cb82..."],
    "hddIds": [],
    "psuId": "65cb83...",
    "caseId": "65cb84...",
    "coolerId": "65cb85..."
  }
  ```
- **Kết quả trả về (Response):**
  ```json
  {
    "success": true,
    "message": "Lưu cấu hình thành công",
    "data": {
      "_id": "65dc...",
      "name": "Cấu hình Gaming 2024",
      "cpu": { "_id": "65cb7e...", "name": "Intel Core i5-12400F" },
      "mainboard": { "_id": "65cb7f...", "name": "B660M" },
      ...
    }
  }
  ```

### 4. Danh sách cấu hình của tôi
- **Endpoint:** `GET /api/v1/builds/my-builds`
- **Chức năng:** Trả về danh sách tất cả các bộ cấu hình PC mà người dùng hiện tại đã lưu.
- **Kết quả trả về (Response):**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65dc...",
        "name": "Cấu hình Gaming 2024",
        "cpu": { "name": "Intel Core i5-12400F" },
        "createdAt": "2024-03-31T..."
      }
    ]
  }
  ```

### 5. Chi tiết cấu hình của tôi
- **Endpoint:** `GET /api/v1/builds/my-builds/{id}`
- **Chức năng:** Lấy thông tin chi tiết về các linh kiện trong một bộ cấu hình cụ thể dựa trên ID.
- **Kết quả trả về (Response):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "65dc...",
      "name": "Cấu hình Gaming 2024",
      "cpu": { "_id": "65cb7e...", "name": "Intel Core i5-12400F" },
      "mainboard": { "_id": "65cb7f...", "name": "B660M" },
      "vga": { "_id": "65cb81...", "name": "RTX 4060" },
      ...
    }
  }
  ```

### 6. Cập nhật cấu hình của tôi
- **Endpoint:** `PUT /api/v1/builds/my-builds/{id}`
- **Chức năng:** Chỉnh sửa tên, mô tả hoặc thay đổi các linh kiện trong một bộ cấu hình đã lưu.
- **Dữ liệu yêu cầu (Request Body):** Tương tự như `/save-build` (có thể gửi các trường cần cập nhật).
- **Kết quả trả về (Response):**
  ```json
  {
    "success": true,
    "message": "Cập nhật cấu hình thành công",
    "data": { ...thông tin cấu hình sau khi cập nhật... }
  }
  ```

### 7. Xóa cấu hình của tôi
- **Endpoint:** `DELETE /api/v1/builds/my-builds/{id}`
- **Chức năng:** Gỡ bỏ hoàn toàn một bộ cấu hình khỏi danh sách lưu trữ của người dùng.
- **Kết quả trả về (Response):**
  ```json
  {
    "success": true,
    "message": "Xóa cấu hình thành công"
  }
  ```
