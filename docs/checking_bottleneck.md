# API CHECK BOTTLENECK CHO CẤU HÌNH PC

## 1. Mục tiêu chức năng

API này dùng để **kiểm tra nghẽn cổ chai (bottleneck)** của cấu hình PC mà người dùng đã chọn.

Chức năng này **chỉ tập trung vào bottleneck CPU ↔ GPU**, vì trong cấu hình máy tính, hai thành phần này là yếu tố quyết định hiệu năng chính khi chơi game và xử lý đồ họa.

Các tối ưu khác như:

* RAM bus thấp
* RAM dung lượng thấp
* PSU dư / thiếu
* Cooler chưa tối ưu
* Storage chậm

đã được xử lý bởi **API Warning / Compatibility khác**, nên **API này chỉ tập trung duy nhất vào bottleneck CPU và GPU**.

---

# 2. Nguồn dữ liệu benchmark

Điểm benchmark được lấy từ hệ thống benchmark của
PassMark Software

Các trang benchmark chính:

### CPU benchmark

https://www.cpubenchmark.net/

Trang danh sách CPU:

https://www.cpubenchmark.net/cpu_list.php

Trang chi tiết CPU:

https://www.cpubenchmark.net/cpu.php?id=CPU_ID

### GPU benchmark

https://www.videocardbenchmark.net/

Trang danh sách GPU:

https://www.videocardbenchmark.net/gpu_list.php

Trang chi tiết GPU:

https://www.videocardbenchmark.net/gpu.php?id=GPU_ID

### Điểm sử dụng trong hệ thống

CPU:

* `CPU Mark`

GPU:

* `G3D Mark`

Các điểm này sẽ được **lưu trực tiếp trong database** khi seed dữ liệu linh kiện.

Ví dụ:

```
CPU
{
  name: "Ryzen 5 5600",
  score: 22000
}

GPU
{
  name: "RTX 4070",
  score: 31000
}
```

Hệ thống **không crawl benchmark runtime**.

---

# 3. Endpoint API

```
POST /api/builds/check-bottleneck
```

---

# 4. Request

Request nhận cấu hình mà người dùng đã build.

Tuy nhiên **bottleneck calculation chỉ sử dụng CPU và GPU**.

Các thành phần khác được gửi để đảm bảo cấu trúc build hoàn chỉnh.

### Request Body

```json
{
  "cpuId": "string",
  "mainboardId": "string",
  "ramId": "string",
  "ramQuantity": 2,
  "vgaId": "string",
  "ssdIds": ["string"],
  "hddIds": ["string"],
  "psuId": "string",
  "caseId": "string",
  "coolerId": "string"
}
```

### Required

```
cpuId
vgaId
```

Nếu thiếu CPU hoặc GPU thì API sẽ trả lỗi.

---

# 5. Flow xử lý

Backend thực hiện các bước sau:

1. Nhận request
2. Fetch CPU từ MongoDB
3. Fetch GPU từ MongoDB
4. Lấy benchmark score của CPU và GPU
5. Tính toán bottleneck
6. Trả kết quả cho cả 3 độ phân giải

Flow:

```
Request
   ↓
Controller
   ↓
Fetch CPU + GPU
   ↓
Bottleneck Engine
   ↓
Generate Result
   ↓
Response
```

---

# 6. Công thức tính Bottleneck

Bottleneck được xác định dựa trên **tỷ lệ hiệu năng CPU và GPU**.

### Bước 1: Tính ratio cơ bản

```
ratio = cpuScore / gpuScore
```

Ví dụ:

```
cpuScore = 8716
gpuScore = 16747

ratio = 0.52
```

---

# 7. Resolution Weight

Bottleneck phụ thuộc độ phân giải khi chơi game.

| Resolution | Weight |
| ---------- | ------ |
| 1080p      | 1.2    |
| 2K (1440p) | 1.0    |
| 4K         | 0.8    |

Tính ratio cho từng độ phân giải:

```
adjustedRatio = ratio × resolutionWeight
```

---

# 8. Phân loại Bottleneck

| Ratio     | Kết luận                  |
| --------- | ------------------------- |
| 0.9 – 1.1 | Balanced                  |
| 0.7 – 0.9 | CPU bottleneck nhẹ        |
| 0.5 – 0.7 | CPU bottleneck trung bình |
| < 0.5     | CPU bottleneck nặng       |
| 1.1 – 1.3 | GPU bottleneck nhẹ        |
| 1.3 – 1.6 | GPU bottleneck trung bình |
| > 1.6     | GPU bottleneck nặng       |

---

# 9. Severity Levels

| Severity | Ý nghĩa               |
| -------- | --------------------- |
| NONE     | Không bottleneck      |
| LOW      | Bottleneck nhẹ        |
| MEDIUM   | Bottleneck trung bình |
| HIGH     | Bottleneck nặng       |

---

# 10. Kết quả cho từng độ phân giải

API sẽ tính bottleneck cho:

```
1080p
2K (1440p)
4K
```

Mỗi độ phân giải trả kết quả riêng.

---

# 11. Response Structure

```json
{
  "success": true,
  "data": {
    "cpu": {
      "name": "Intel Core i3-10100F",
      "score": 8716
    },
    "gpu": {
      "name": "GeForce RTX 3060",
      "score": 16747
    },
    "results": {
      "1080p": {
        "bottleneck": true,
        "type": "CPU",
        "severity": "MEDIUM",
        "ratio": 0.62,
        "message": "CPU Intel Core i3-10100F có thể giới hạn hiệu năng của RTX 3060 khi chơi game ở độ phân giải 1080p."
      },
      "2k": {
        "bottleneck": true,
        "type": "CPU",
        "severity": "MEDIUM",
        "ratio": 0.52,
        "message": "CPU Intel Core i3-10100F có thể giới hạn hiệu năng của RTX 3060 khi chơi game ở độ phân giải 2K."
      },
      "4k": {
        "bottleneck": true,
        "type": "CPU",
        "severity": "HIGH",
        "ratio": 0.41,
        "message": "CPU Intel Core i3-10100F có thể trở thành điểm nghẽn đáng kể cho RTX 3060 ở độ phân giải 4K."
      }
    }
  }
}
```

---

# 12. Pseudo Code Logic

```
ratio = cpuScore / gpuScore

for each resolution:

    adjustedRatio = ratio × resolutionWeight

    if adjustedRatio < 0.9
        type = CPU
    else if adjustedRatio > 1.1
        type = GPU
    else
        type = NONE

    determine severity
```

---

# 13. Ví dụ thực tế

CPU

```
Intel Core i3-10100F
score = 8716
```

GPU

```
RTX 3060
score = 16747
```

```
ratio = 8716 / 16747 = 0.52
```

1080p:

```
0.52 × 1.2 = 0.62
```

→ CPU bottleneck MEDIUM

---

# 14. Ưu điểm của phương pháp

Phương pháp này:

* đơn giản
* deterministic
* dễ maintain
* dễ scale

Không phụ thuộc AI.

AI có thể được dùng **ở bước generate explanation**, nhưng **không tham gia tính toán bottleneck**.

---

# 15. Tổng kết

Chức năng Bottleneck Checker:

* sử dụng benchmark từ PassMark
* tính toán dựa trên CPU/GPU score
* đánh giá bottleneck cho 3 độ phân giải
* trả kết quả rõ ràng cho frontend

Hệ thống này hoạt động độc lập với:

* Compatibility Checker
* Hardware Warning Engine
