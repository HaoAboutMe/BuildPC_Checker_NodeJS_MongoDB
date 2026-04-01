var express = require("express");
var router = express.Router();
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const { importHandler } = require("../controllers/importController");
const authMiddleware = require("../utils/authMiddleware");
const { isAdmin } = require("../utils/roleMiddleware");

// Cloudinary storage — dùng cho upload ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ được phép tải lên tệp hình ảnh!"), false);
  }
};

const uploadCloudinary = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Multer memory storage — chỉ dùng cho import Excel (không lưu đĩa)
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file Excel (.xlsx, .xls)"), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // tối đa 10MB
});

/**
 * @swagger
 * /api/v1/files/upload:
 *   post:
 *     summary: Upload an image
 *     tags: [File]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 url: { type: string, example: "https://res.cloudinary.com/demo/image/upload/v12345/xyz.webp" }
 */
router.post(
  "/upload",
  authMiddleware,
  uploadCloudinary.single("image"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng chọn một tệp để tải lên" });
    }

    // Với cloudinary-storage, req.file.path là URL của ảnh trên Cloudinary
    const imageUrl = req.file.path;

    res.status(200).json({
      success: true,
      message: "Tải lên ảnh thành công",
      url: imageUrl,
    });
  }
);

/**
 * @swagger
 * /api/v1/files/import:
 *   post:
 *     summary: Import linh kiện PC từ file Excel (Chunk-level Transaction)
 *     description: |
 *       Upload file Excel để import hàng loạt linh kiện PC.
 *       **Các cột tham chiếu (socket, pcieVersion, ramType...) ghi TÊN vào Excel,
 *       backend tự động tra cứu và map sang ObjectId.**
 *
 *       Cấu trúc cột Excel theo từng loại:
 *       - **cpu**: name | vrmMin | igpu | tdp | pcieVersion | socket | score | imageUrl | description
 *       - **mainboard**: name | socket | vrmPhase | cpuTdpSupport | ramType | ramBusMax | ramSlot | ramMaxCapacity | size | pcieVgaVersion | m2Slot | sataSlot | imageUrl | description
 *       - **ram**: name | ramType | ramBus | ramCas | capacityPerStick | quantity | tdp | imageUrl | description
 *       - **vga**: name | pcieVersion | powerConnector | lengthMm | tdp | score | imageUrl | description
 *       - **ssd**: name | ssdType | formFactor | interfaceType | capacity | tdp | imageUrl | description
 *       - **hdd**: name | formFactor | interfaceType | capacity | tdp | imageUrl | description
 *       - **psu**: name | wattage | efficiency | pcieConnectors (ngăn cách phẩy) | sataConnector | imageUrl | description
 *       - **pc-case**: name | size | maxVgaLengthMm | maxCoolerHeightMm | maxRadiatorSize | drive35Slot | drive25Slot | imageUrl | description
 *       - **cooler**: name | coolerType | radiatorSize | heightMm | tdpSupport | imageUrl | description
 *     tags: [File]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cpu, mainboard, ram, vga, ssd, hdd, psu, pc-case, cooler]
 *         description: Loại linh kiện cần import
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "File Excel (.xlsx) — Row 1 là header, Row 2 trở đi là dữ liệu. Cột ref ghi TÊN entity (ví dụ: AM5, PCIe 5.0)"
 *     responses:
 *       200:
 *         description: Import hoàn tất (có thể có chunk/dòng thất bại)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 totalRows: { type: number }
 *                 totalSuccessChunks: { type: number }
 *                 totalFailedChunks: { type: number }
 *                 failedChunks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rows: { type: string, example: "52-101" }
 *                       reason: { type: string }
 *       400:
 *         description: Thiếu file, sai loại file, hoặc type không hợp lệ
 */
router.post(
  "/import",
  [authMiddleware, isAdmin, uploadExcel.single("file")],
  importHandler
);

module.exports = router;
