# Báo Cáo Chiến Lược Import Dữ Liệu Excel (Với Yêu Cầu Transaction)

Tôi hoàn toàn đồng ý và thấu hiểu vấn đề của bạn. Trong các dự án (đặc biệt là đồ án, dự án tốt nghiệp hoặc dự án cần demo triệt để các tính năng của Database), việc bắt buộc phải có một chức năng thể hiện kĩ năng áp dụng **Transaction** là điều cực kỳ thiết thực. 

Kết hợp với 2 lựa chọn cực kì an toàn của bạn là `exceljs` và **Hướng 2 (Backend kiểm soát mapping)**, dưới đây là luồng thiết kế hệ thống chuẩn form nhất để áp dụng Transaction một cách ngoạn mục.

---

## 1. Cơ chế hoạt động của "Chunk-level Transaction" (Transaction theo cụm)

Thay vì thực hiện 1 transaction khổng lồ cho cả file 1000 dòng sẽ gây quá tải RAM DB, ta phân bổ Transaction theo block (cụm). 
Cú pháp logic bạn đề xuất **"Lỗi đoạn 51-100 thì huỷ 51-100, đi tiếp 101-150"** là một pattern có tên gọi **"Partial Batch Failure"**.

Đặc điểm của quá trình này:
- Cụm nào thành công 100% -> `commitTransaction` -> dữ liệu được ghi vĩnh viễn lưu vào DB.
- Cụm nào có BẤT KỲ 1 dòng lỗi (trùng lặp, sai kiểu...) -> bóp chết cả cụm bằng `abortTransaction` -> Không có dòng nào trong lô lỗi lọt được vào DB. Điểm hay là điều này ngăn ngừa việc lọt một tập dữ liệu "rác" không toàn vẹn.

---

## 2. Các Công Nghệ & Khái Niệm Cần Chuẩn Bị
1. **Libraries**: `exceljs` (để đọc file dễ dàng kiểm soát ô/dòng), `multer` (nhận file từ Client).
2. **MongoDB Session**: `const session = await mongoose.startSession();`
3. **Transaction Commands**: `session.startTransaction()`, `session.commitTransaction()`, `session.abortTransaction()`.

---

## 3. Kiến Trúc Luồng Dữ Liệu (Luồng Đi Quan Trọng)

### Bước 1: Tiếp nhận và định cấu hình API
- Tạo Endpoint: `POST /api/components/import?type=CPU` (hoặc VGA, RAM).
- Nếu Request gửi lên `type=CPU`, Backend lấy ra `CpuMapper` để ánh xạ cứng logic:
  - Cột 1 Excel -> Bỏ qua (vì là Header).
  - Cột A của dòng 2 trở đi -> Lấy gán vào `name`
  - Cột B -> Lấy gán vào `socketType`...

### Bước 2: Thiết lập Streaming với `exceljs`
Sử dụng `workbook.xlsx.read(stream)`. Thay vì đọc hết một cục, logic của bạn sẽ là duyệt tuần tự qua từng row (từ Row 2), chuyển đổi array/object từ row đó rồi đem `push` vào mảng tạm `chunkRows`.

### Bước 3: Đạt ngưỡng Chunking (Batching)
Quy định `CHUNK_SIZE = 50`. Khi độ dài của mảng tạm `chunkRows === 50`, hệ thống tạm dừng việc thêm và đẩy lô này xuống tầng xử lý Database.

### Bước 4: Khởi chạy Transaction Cho Cụm (Điểm Ăn Tiền)
Ở điểm này, kĩ thuật transaction hoạt động như sau:
```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Thực thi 50 lệnh insert cùng lúc bằng bulkWrite
  await Model.bulkWrite(chunkRows, { session: session });
  
  // Nếu cả 50 đều thành công rực rỡ
  await session.commitTransaction();
  console.log(`Lô dòng 51-100 import Thành Công`);
} catch (error) {
  // Lỗi xảy ra ở bất kì dòng nào trong 50 dòng (Ví dụ vi phạm Unique Key)
  await session.abortTransaction();
  console.log(`Lô dòng 51-100 thất bại, đã Rollback lại toàn bộ 50 dòng này`);
  
  // Ghi log lại khoảng lỗi (51-100) để lát trả về cho Client
} finally {
  session.endSession();
}
```

### Bước 5: Sang cụm mới và Lặp lại
Ngay sau khi kết thúc cụm, xoá sạch mảng tạm `chunkRows = []`, tiếp tục đọc Excel (dòng 101) nhét vào mảng.
Nếu dòng cuối cùng không chạm mốc chia hết cho 50 (vd: mảng cuối chỉ có 34 phần tử), tiếp tục đẩy lô 34 phần tử đó vào Transaction 1 lần cuối.

### Bước 6: Tổng Kết Trả Về Frontend
Sau khi Excel kết thúc file dâng thông báo:
```json
{
  "message": "Import hoàn tất tiến trình",
  "totalSuccessChunks": 18,
  "failedChunks": [
    {
      "rows": "51-100",
      "reason": "Mã CPU INTEL-12900K dòng số 54 đã bị trùng lặp trong hệ thống"
    }
  ]
}
```

---

## Tóm Lược
- **Hướng 2 cực kì an toàn:** Kiểm soát tuyệt đối data map với DB.
- **Có Transaction hoàn chỉnh:** Đảm bảo toàn vẹn theo từng khối (Khối đúng thì toàn bộ khối lưu, Khối có 1 con sâu làm rầu nồi canh thì chặt bỏ luôn khối). Báo cáo chính xác lỗi tập trung ở khu vực nào (bắt Client sửa lại đúng cụm 50 dòng đó).
- Hệ thống này chứng minh được bạn nắm vững: **Xử lý File -> Batch Data -> DB Transaction Control -> Error Rollback Pipeline**. Rất có tính điểm nhấn cho backend.
