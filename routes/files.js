var express = require("express");
var router = express.Router();
const multer = require("multer");
const ExcelJS = require("exceljs");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { storage } = require("../utils/cloudinary");
const authMiddleware = require("../utils/authMiddleware");
const { isAdmin } = require("../utils/roleMiddleware");

// Đảm bảo thư mục public/uploads tồn tại
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Component Models ─────────────────────────────────────────────────
const Cpu = require("../schemas/cpu");
const Mainboard = require("../schemas/mainboard");
const Ram = require("../schemas/ram");
const Vga = require("../schemas/vga");
const Ssd = require("../schemas/ssd");
const Hdd = require("../schemas/hdd");
const Psu = require("../schemas/psu");
const PcCase = require("../schemas/pc-case");
const Cooler = require("../schemas/cooler");

// ── Support Entity Models (dùng để lookup name → _id) ────────────────
const Socket = require("../schemas/socket");
const PcieVersion = require("../schemas/pcie-version");
const RamType = require("../schemas/ram-type");
const PcieConnector = require("../schemas/pcie-connector");
const SsdType = require("../schemas/ssd-type");
const FormFactor = require("../schemas/form-factor");
const InterfaceType = require("../schemas/interface-type");
const CaseSize = require("../schemas/case-size");
const CoolerType = require("../schemas/cooler-type");

// =====================================================================
// Bảng lookup model cho từng ref field
// =====================================================================
const REF_MODELS = {
  socket:         Socket,
  pcieVersion:    PcieVersion,
  pcieVgaVersion: PcieVersion, // cùng model, khác field name
  ramType:        RamType,
  powerConnector: PcieConnector,
  pcieConnectors: PcieConnector, // mảng — xử lý riêng
  ssdType:        SsdType,
  formFactor:     FormFactor,
  interfaceType:  InterfaceType,
  size:           CaseSize,
  coolerType:     CoolerType,
};

// =====================================================================
// MAPPER: Ánh xạ cứng cột Excel → field schema
// type: "string" | "number" | "boolean" | "ref" | "ref-array"
//   ref      → tên entity, backend tự lookup _id
//   ref-array→ nhiều tên cách nhau dấu phẩy, lookup từng cái
// =====================================================================
const MAPPERS = {
  cpu: {
    model: Cpu,
    columns: [
      { col: 1,  field: "name",        type: "string"  },
      { col: 2,  field: "vrmMin",      type: "number"  },
      { col: 3,  field: "igpu",        type: "boolean" },
      { col: 4,  field: "tdp",         type: "number"  },
      { col: 5,  field: "pcieVersion", type: "ref"     },
      { col: 6,  field: "socket",      type: "ref"     },
      { col: 7,  field: "score",       type: "number"  },
      { col: 8,  field: "imageUrl",    type: "string"  },
      { col: 9,  field: "description", type: "string"  },
    ],
  },
  mainboard: {
    model: Mainboard,
    columns: [
      { col: 1,  field: "name",           type: "string" },
      { col: 2,  field: "socket",         type: "ref"    },
      { col: 3,  field: "vrmPhase",       type: "number" },
      { col: 4,  field: "cpuTdpSupport",  type: "number" },
      { col: 5,  field: "ramType",        type: "ref"    },
      { col: 6,  field: "ramBusMax",      type: "number" },
      { col: 7,  field: "ramSlot",        type: "number" },
      { col: 8,  field: "ramMaxCapacity", type: "number" },
      { col: 9,  field: "size",           type: "ref"    },
      { col: 10, field: "pcieVgaVersion", type: "ref"    },
      { col: 11, field: "m2Slot",         type: "number" },
      { col: 12, field: "sataSlot",       type: "number" },
      { col: 13, field: "imageUrl",       type: "string" },
      { col: 14, field: "description",    type: "string" },
    ],
  },
  ram: {
    model: Ram,
    columns: [
      { col: 1, field: "name",             type: "string" },
      { col: 2, field: "ramType",          type: "ref"    },
      { col: 3, field: "ramBus",           type: "number" },
      { col: 4, field: "ramCas",           type: "number" },
      { col: 5, field: "capacityPerStick", type: "number" },
      { col: 6, field: "quantity",         type: "number" },
      { col: 7, field: "tdp",              type: "number" },
      { col: 8, field: "imageUrl",         type: "string" },
      { col: 9, field: "description",      type: "string" },
    ],
  },
  vga: {
    model: Vga,
    columns: [
      { col: 1, field: "name",           type: "string" },
      { col: 2, field: "pcieVersion",    type: "ref"    },
      { col: 3, field: "powerConnector", type: "ref"    },
      { col: 4, field: "lengthMm",       type: "number" },
      { col: 5, field: "tdp",            type: "number" },
      { col: 6, field: "score",          type: "number" },
      { col: 7, field: "imageUrl",       type: "string" },
      { col: 8, field: "description",    type: "string" },
    ],
  },
  ssd: {
    model: Ssd,
    columns: [
      { col: 1, field: "name",          type: "string" },
      { col: 2, field: "ssdType",       type: "ref"    },
      { col: 3, field: "formFactor",    type: "ref"    },
      { col: 4, field: "interfaceType", type: "ref"    },
      { col: 5, field: "capacity",      type: "number" },
      { col: 6, field: "tdp",           type: "number" },
      { col: 7, field: "imageUrl",      type: "string" },
      { col: 8, field: "description",   type: "string" },
    ],
  },
  hdd: {
    model: Hdd,
    columns: [
      { col: 1, field: "name",          type: "string" },
      { col: 2, field: "formFactor",    type: "ref"    },
      { col: 3, field: "interfaceType", type: "ref"    },
      { col: 4, field: "capacity",      type: "number" },
      { col: 5, field: "tdp",           type: "number" },
      { col: 6, field: "imageUrl",      type: "string" },
      { col: 7, field: "description",   type: "string" },
    ],
  },
  psu: {
    model: Psu,
    columns: [
      { col: 1, field: "name",           type: "string"    },
      { col: 2, field: "wattage",        type: "number"    },
      { col: 3, field: "efficiency",     type: "string"    },
      { col: 4, field: "pcieConnectors", type: "ref-array" }, // "16-pin,8-pin"
      { col: 5, field: "sataConnector",  type: "number"    },
      { col: 6, field: "imageUrl",       type: "string"    },
      { col: 7, field: "description",    type: "string"    },
    ],
  },
  "pc-case": {
    model: PcCase,
    columns: [
      { col: 1, field: "name",              type: "string" },
      { col: 2, field: "size",              type: "ref"    },
      { col: 3, field: "maxVgaLengthMm",    type: "number" },
      { col: 4, field: "maxCoolerHeightMm", type: "number" },
      { col: 5, field: "maxRadiatorSize",   type: "number" },
      { col: 6, field: "drive35Slot",       type: "number" },
      { col: 7, field: "drive25Slot",       type: "number" },
      { col: 8, field: "imageUrl",          type: "string" },
      { col: 9, field: "description",       type: "string" },
    ],
  },
  cooler: {
    model: Cooler,
    columns: [
      { col: 1, field: "name",         type: "string" },
      { col: 2, field: "coolerType",   type: "ref"    },
      { col: 3, field: "radiatorSize", type: "number" },
      { col: 4, field: "heightMm",     type: "number" },
      { col: 5, field: "tdpSupport",   type: "number" },
      { col: 6, field: "imageUrl",     type: "string" },
      { col: 7, field: "description",  type: "string" },
    ],
  },
};

const CHUNK_SIZE = 50;

// =====================================================================
// Helper: Convert giá trị ô Excel sang đúng kiểu
// =====================================================================
function castValue(rawValue, type) {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return undefined;
  }
  switch (type) {
    case "number": {
      const n = Number(rawValue);
      return isNaN(n) ? undefined : n;
    }
    case "boolean": {
      if (typeof rawValue === "boolean") return rawValue;
      const s = String(rawValue).toLowerCase().trim();
      if (s === "true" || s === "1" || s === "yes") return true;
      if (s === "false" || s === "0" || s === "no") return false;
      return undefined;
    }
    default:
      return String(rawValue).trim();
  }
}

// =====================================================================
// Helper: Build lookup cache name→_id cho tất cả ref models cần dùng
// Tránh N+1 query: load 1 lần toàn bộ collection, cache vào Map
// =====================================================================
async function buildRefCache(columns) {
  const cache = {}; // { fieldName: Map<name, _id> }

  const refFields = columns.filter(
    (c) => c.type === "ref" || c.type === "ref-array"
  );

  const uniqueFields = [...new Set(refFields.map((c) => c.field))];

  await Promise.all(
    uniqueFields.map(async (field) => {
      const Model = REF_MODELS[field];
      if (!Model) return;
      const docs = await Model.find({ isDeleted: false }, { name: 1 });
      const map = new Map();
      docs.forEach((d) => map.set(d.name.trim().toLowerCase(), d._id));
      cache[field] = map;
    })
  );

  return cache;
}

// =====================================================================
// Helper: Resolve tên → ObjectId dùng cache
// =====================================================================
function resolveRef(cache, field, nameRaw) {
  if (!nameRaw) return { id: undefined, error: null };
  const name = String(nameRaw).trim();
  const map = cache[field];
  if (!map) return { id: undefined, error: `Không có cache cho field "${field}"` };
  const id = map.get(name.toLowerCase());
  if (!id) return { id: undefined, error: `Không tìm thấy "${name}" trong danh sách ${field}` };
  return { id, error: null };
}

// =====================================================================
// Helper: Xử lý từng chunk với Transaction
// =====================================================================
async function processChunk(Model, chunkDocs, startRow) {
  const endRow = startRow + chunkDocs.length - 1;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await Model.insertMany(chunkDocs, { session });
    await session.commitTransaction();
    return { success: true };
  } catch (error) {
    try { await session.abortTransaction(); } catch (_) {}
    return {
      success: false,
      rows: `${startRow}-${endRow}`,
      reason: error.message,
    };
  } finally {
    session.endSession();
  }
}

// ── Multer storages ───────────────────────────────────────────────────

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

// Multer disk storage — lưu file Excel vào public/uploads
const excelDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}_${timestamp}${ext}`);
  },
});

const uploadExcel = multer({
  storage: excelDiskStorage,
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

// =====================================================================
// ROUTES
// =====================================================================

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
  [authMiddleware, isAdmin, uploadCloudinary.single("image")],
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
  async (req, res) => {
    try {
      const type = req.query.type;
      const mapper = MAPPERS[type];

      if (!mapper) {
        return res.status(400).json({
          success: false,
          message: `Loại linh kiện không hợp lệ. Các loại hỗ trợ: ${Object.keys(MAPPERS).join(", ")}`,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng upload file Excel (.xlsx)",
        });
      }

      // ── Đọc file Excel từ path đã lưu trên disk ──────────────────────
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      const worksheet = workbook.worksheets[0];

      // URL công khai truy cập file (vd: /uploads/cpu_1234567890.xlsx)
      const fileUrl = `/uploads/${req.file.filename}`;

      if (!worksheet) {
        return res.status(400).json({
          success: false,
          message: "File Excel không hợp lệ hoặc không có sheet nào",
        });
      }

      const { model: Model, columns } = mapper;

      // ── Build ref cache 1 lần ─────────────────────────────────────────
      const refCache = await buildRefCache(columns);

      // ── Lấy danh sách hàng dữ liệu (bỏ header row 1) ─────────────────
      const dataRows = [];
      worksheet.eachRow((row, rowIdx) => {
        if (rowIdx === 1) return;
        dataRows.push({ row, excelRowNum: rowIdx });
      });

      let totalRows = 0;
      let totalSuccessChunks = 0;
      const failedChunks = [];

      // ── Parse 1 row → { doc, hasName, error } ────────────────────────
      function parseRow(row, excelRowNum) {
        const doc = {};
        let hasName = false;
        let rowError = null;

        for (const colDef of columns) {
          if (rowError) break;
          const rawValue = row.getCell(colDef.col).value;

          if (colDef.type === "ref") {
            const { id, error } = resolveRef(refCache, colDef.field, rawValue);
            if (error) { rowError = `Dòng ${excelRowNum}: ${error}`; break; }
            if (id) doc[colDef.field] = id;

          } else if (colDef.type === "ref-array") {
            if (rawValue) {
              const names = String(rawValue).split(",").map((s) => s.trim());
              const ids = [];
              for (const n of names) {
                const { id, error } = resolveRef(refCache, colDef.field, n);
                if (error) { rowError = `Dòng ${excelRowNum}: ${error}`; break; }
                if (id) ids.push(id);
              }
              doc[colDef.field] = ids;
            }

          } else {
            const casted = castValue(rawValue, colDef.type);
            if (colDef.field === "name" && casted) hasName = true;
            if (casted !== undefined) doc[colDef.field] = casted;
          }
        }

        return { doc, hasName, error: rowError };
      }

      // ── Duyệt từng CHUNK (mỗi chunk = CHUNK_SIZE dòng) ───────────────
      let i = 0;
      while (i < dataRows.length) {
        const chunkItems = []; // [{ doc, excelRowNum, error }]
        const chunkErrors = []; // TẤT CẢ lỗi trong chunk

        while (chunkItems.length < CHUNK_SIZE && i < dataRows.length) {
          const { row, excelRowNum } = dataRows[i];
          i++;

          const { doc, hasName, error } = parseRow(row, excelRowNum);
          if (!hasName) continue; // bỏ dòng trống

          totalRows++;
          chunkItems.push({ doc, excelRowNum, error });

          if (error) chunkErrors.push(error);
        }

        if (chunkItems.length === 0) continue;

        const chunkStartRow = chunkItems[0].excelRowNum;
        const chunkEndRow = chunkItems[chunkItems.length - 1].excelRowNum;
        const rowsRange =
          chunkStartRow === chunkEndRow
            ? `${chunkStartRow}`
            : `${chunkStartRow}-${chunkEndRow}`;

        // ── Pre-check trùng tên với DB ────────────────────────────────
        const names = chunkItems.map((item) => item.doc.name).filter(Boolean);
        if (names.length > 0) {
          const duplicates = await Model.find(
            { name: { $in: names }, isDeleted: false },
            { name: 1 }
          );
          duplicates.forEach((dup) => {
            const matchItem = chunkItems.find((item) => item.doc.name === dup.name);
            const rowInfo = matchItem ? `Dòng ${matchItem.excelRowNum}` : "Không rõ dòng";
            chunkErrors.push(`${rowInfo}: Tên "${dup.name}" đã tồn tại trong hệ thống`);
          });
        }

        if (chunkErrors.length > 0) {
          // ── Có ít nhất 1 lỗi → FAIL toàn bộ chunk, không insert gì cả
          failedChunks.push({
            rows: rowsRange,
            reasons: chunkErrors,
            reason: chunkErrors.join(" | "),
          });
        } else {
          // ── Tất cả dòng hợp lệ → thử insert với Transaction
          const docs = chunkItems.map((item) => item.doc);
          const result = await processChunk(Model, docs, chunkStartRow);
          if (result.success) {
            totalSuccessChunks++;
          } else {
            failedChunks.push({ rows: result.rows, reason: result.reason });
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Import hoàn tất tiến trình",
        fileUrl,
        totalRows,
        totalSuccessChunks,
        totalFailedChunks: failedChunks.length,
        failedChunks,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
