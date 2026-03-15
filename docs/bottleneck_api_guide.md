# Hướng dẫn sử dụng API Kiểm tra Nghẽn cổ chai (Bottleneck Checker)

Tài liệu này hướng dẫn cách sử dụng API để kiểm tra mức độ nghẽn cổ chai giữa CPU và GPU trong một cấu hình PC.

## 1. Thông tin Endpoint

- **URL:** `/api/v1/builds/check-bottleneck`
- **Method:** `POST`
- **Auth:** Không yêu cầu (Public API)

## 2. Cấu trúc Request

Cung cấp ID của CPU và VGA (GPU) cần kiểm tra.

```json
{
  "cpuId": "65f1234567890abcdef12345",
  "vgaId": "65f9876543210fedcba54321"
}
```

- `cpuId` (Bắt buộc): ID của CPU trong hệ thống.
- `vgaId` (Bắt buộc): ID của VGA trong hệ thống.

## 3. Logic tính toán

Hệ thống tính toán dựa trên điểm benchmark (PassMark) của CPU và GPU:
1. Tính tỷ lệ (ratio) cơ bản: `ratio = CPU_Score / GPU_Score`.
2. Áp dụng trọng số theo độ phân giải:
   - **1080p:** Weight 1.2 (CPU quan trọng hơn).
   - **2K (1440p):** Weight 1.0 (Cân bằng).
   - **4K:** Weight 0.8 (GPU quan trọng hơn).
3. Đánh giá mức độ nghẽn dựa trên tỷ lệ đã điều chỉnh.

## 4. Cấu trúc Response

### Thành công (200 OK)

```json
{
  "success": true,
  "data": {
    "cpu": {
      "name": "Intel Core i3-12100F",
      "score": 14000
    },
    "gpu": {
      "name": "NVIDIA GeForce RTX 4070 SUPER",
      "score": 31000
    },
    "results": {
      "1080p": {
        "bottleneck": true,
        "type": "CPU",
        "severity": "HIGH",
        "ratio": 0.54,
        "message": "CPU Intel Core i3-12100F là điểm nghẽn nghiêm trọng cho NVIDIA GeForce RTX 4070 SUPER ở độ phân giải 1080p. Hiệu năng GPU sẽ bị lãng phí đáng kể."
      },
      "2k": {
        "bottleneck": true,
        "type": "CPU",
        "severity": "HIGH",
        "ratio": 0.45,
        "message": "CPU Intel Core i3-12100F là điểm nghẽn nghiêm trọng cho NVIDIA GeForce RTX 4070 SUPER ở độ phân giải 2K (1440p). Hiệu năng GPU sẽ bị lãng phí đáng kể."
      },
      "4k": {
        "bottleneck": true,
        "type": "CPU",
        "severity": "HIGH",
        "ratio": 0.36,
        "message": "CPU Intel Core i3-12100F là điểm nghẽn nghiêm trọng cho NVIDIA GeForce RTX 4070 SUPER ở độ phân giải 4K. Hiệu năng GPU sẽ bị lãng phí đáng kể."
      }
    }
  }
}
```

### Các trường trong `results`:

| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `bottleneck` | Boolean | `true` nếu có nghẽn (Severity khác NONE), `false` nếu cân bằng. |
| `type` | String | `CPU` (CPU yếu hơn), `GPU` (GPU yếu hơn), `NONE` (Cân bằng), `UNKNOWN`. |
| `severity` | String | Mức độ nghẽn: `NONE`, `LOW`, `MEDIUM`, `HIGH`. |
| `ratio` | Number | Tỷ lệ hiệu năng sau khi đã áp trọng số độ phân giải. |
| `message` | String | Thông điệp hướng dẫn chi tiết cho người dùng. |

### Lỗi (400 Bad Request / 500 Internal Server Error)

- **400:** Thiếu `cpuId` hoặc `vgaId`.
- **404:** Không tìm thấy linh kiện tương ứng với ID cung cấp.
- **500:** Lỗi hệ thống không xác định.

## 5. Lưu ý
- Nếu một trong hai linh kiện có điểm benchmark bằng 0 hoặc không có dữ liệu, kết quả trả về sẽ có `type: "UNKNOWN"` và thông báo "Không thể xác định bottleneck".
- API này chỉ tính toán trên phương diện hiệu năng thô của CPU/GPU, không thay thế cho các bài test thực tế trên từng tựa game cụ thể.
