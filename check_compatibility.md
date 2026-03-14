🎯 1. Thiết kế API
Endpoint
POST /api/v1/builds/check-compatibility
Request Body
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

Lưu ý:

Có thể thiếu component

API không được crash

Phải check null / undefined

Ví dụ user mới chọn CPU + RAM thì vẫn chạy được.

🎯 2. Response Structure

Không throw error khi không tương thích.

Trả về object:

{
  compatible: Boolean,
  errors: [String],
  warnings: [String],
  recommendedPsuWattage: Number
}
Ý nghĩa
Field	Ý nghĩa
compatible	build có hợp lệ không
errors	lỗi khiến build không chạy
warnings	build được nhưng chưa tối ưu
recommendedPsuWattage	công suất PSU nên dùng
🎯 3. Response API chuẩn
{
  "success": true,
  "data": {
    "compatible": false,
    "errors": [
      "CPU socket không khớp Mainboard",
      "PSU không đủ công suất"
    ],
    "warnings": [
      "PCIe sẽ chạy ở tốc độ thấp hơn"
    ],
    "recommendedPsuWattage": 650
  }
}
🎯 4. Flow Backend (NodeJS)
Controller
controllers/build.controller.js

Flow:

1. nhận request
2. fetch component từ MongoDB
3. gọi compatibility service
4. trả result

Ví dụ:

const checkCompatibility = async (req, res) => {

  const build = req.body;

  const result = await buildService.checkCompatibility(build);

  return res.json({
    success: true,
    data: result
  });

};
🎯 5. Service Architecture

Tách logic thành service.

services/
   build.service.js
   compatibility/
        cpuChecker.js
        ramChecker.js
        vgaChecker.js
        storageChecker.js
        coolerChecker.js
        powerChecker.js

build.service.js

Flow:

1 fetch component
2 chạy từng checker
3 gom errors + warnings
4 tính PSU recommended
5 trả result

Pseudo:

async function checkCompatibility(build) {

  const errors = [];
  const warnings = [];

  const components = await fetchComponents(build);

  cpuChecker(components, errors, warnings);
  ramChecker(components, errors, warnings);
  vgaChecker(components, errors, warnings);
  storageChecker(components, errors, warnings);
  coolerChecker(components, errors, warnings);
  const recommendedPsu = powerChecker(components, errors, warnings);

  return {
    compatible: errors.length === 0,
    errors,
    warnings,
    recommendedPsuWattage: recommendedPsu
  };

}
🎯 6. Thứ tự Check (rất quan trọng)
1️⃣ Core Check

CPU ↔ Mainboard

Check:

cpu.socket === mainboard.socket
mainboard.vrmPhase >= cpu.vrmMin
mainboard.cpuTdpSupport >= cpu.tdp

Fail → build fail.

2️⃣ RAM Check
ram.ramType === mainboard.ramType
ram.bus <= mainboard.ramBusMax
ramQuantity <= mainboard.ramSlot
totalRamCapacity <= mainboard.ramMaxCapacity
3️⃣ VGA Check

Check:

PCIe backward compatible
vga.length <= case.maxVgaLengthMm
4️⃣ Storage Check

Tính tổng:

totalM2
totalSata

Check:

mainboard.m2Slot
mainboard.sataSlot
case.driveBays
5️⃣ Cooler Check
cpu.tdp <= cooler.tdpSupport

Nếu AIR:

cooler.height <= case.maxCoolerHeightMm

Nếu AIO:

radiatorSize <= case.maxRadiatorSize
6️⃣ Power Check (cuối cùng)

Tính tổng TDP:

totalTdp =
cpu.tdp
+ vga.tdp
+ (ram.tdp × quantity)
+ sum(ssd.tdp)
+ sum(hdd.tdp)
+ 50W overhead

Recommended PSU:

recommendedPsu = totalTdp * 1.2

Check:

psu.wattage >= recommendedPsu
psu.connector match
psu.sataConnector đủ
🎯 7. PCIe Backward Compatible Logic

Tạo helper:

function pcieRank(version) {

  switch (version) {
    case "PCIE_3": return 3;
    case "PCIE_4": return 4;
    case "PCIE_5": return 5;
    default: return 0;
  }

}

Compatible nếu:

mainboardRank >= vgaRank

Nếu:

mainboardRank < vgaRank

→ warning:

"PCIe sẽ chạy ở tốc độ thấp hơn"
🎯 8. Bắt buộc: Support Partial Build

User có thể chưa chọn đủ linh kiện.

Ví dụ:

CPU
Mainboard
RAM

Chưa có:

VGA
Cooler
PSU

Checker phải làm kiểu:

if (!components.cpu || !components.mainboard) return;

Không được crash.

🎯 9. MongoDB Query Pattern

Fetch component:

const cpu = build.cpuId
  ? await CpuModel.findById(build.cpuId)
  : null;

Storage:

const ssds = build.ssdIds?.length
  ? await SsdModel.find({ _id: { $in: build.ssdIds } })
  : [];
🎯 10. Flow Frontend → Backend

Frontend:

User chọn linh kiện
↓
Click "Kiểm tra tương thích"
↓
Call API
POST /api/builds/check-compatibility

Backend:

Controller
↓
Build Service
↓
Fetch MongoDB
↓
Run Checkers
↓
Aggregate Errors
↓
Return Result