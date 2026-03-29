const ExcelJS = require("exceljs");
const mongoose = require("mongoose");

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

const CHUNK_SIZE = 50;

// =====================================================================
// Bảng lookup model cho từng ref field
// =====================================================================
const REF_MODELS = {
  socket:        Socket,
  pcieVersion:   PcieVersion,
  pcieVgaVersion:PcieVersion, // cùng model, khác field name
  ramType:       RamType,
  powerConnector:PcieConnector,
  pcieConnectors:PcieConnector, // mảng — xử lý riêng
  ssdType:       SsdType,
  formFactor:    FormFactor,
  interfaceType: InterfaceType,
  size:          CaseSize,
  coolerType:    CoolerType,
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

  // Lấy danh sách model cần query (unique)
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
    await session.abortTransaction();
    return {
      success: false,
      rows: `${startRow}-${endRow}`,
      reason: error.message,
    };
  } finally {
    session.endSession();
  }
}

// =====================================================================
// Main handler: POST /api/v1/files/import?type=cpu
// Không cần query param _id — chỉ cần type
// =====================================================================
const importHandler = async (req, res) => {
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

    // ── Đọc file Excel từ buffer ──────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: "File Excel không hợp lệ hoặc không có sheet nào",
      });
    }

    const { model: Model, columns } = mapper;

    // ── Build ref cache 1 lần trước khi đọc từng row ─────────────────
    const refCache = await buildRefCache(columns);

    // ── Duyệt từng row ───────────────────────────────────────────────
    const dataRows = [];
    worksheet.eachRow((row, rowIdx) => {
      if (rowIdx === 1) return; // bỏ header
      dataRows.push(row);
    });

    let chunkDocs = [];
    let chunkStartRow = 2; // row 1 là header, data bắt đầu từ row 2
    let currentChunkStart = 2;
    let totalSuccessChunks = 0;
    const failedChunks = [];
    let totalRows = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const excelRowNum = i + 2; // +2 vì bỏ header
      const doc = {};
      let hasName = false;
      let rowError = null;

      for (const colDef of columns) {
        const rawValue = row.getCell(colDef.col).value;

        if (colDef.type === "ref") {
          const { id, error } = resolveRef(refCache, colDef.field, rawValue);
          if (error) {
            rowError = `Dòng ${excelRowNum}: ${error}`;
            break;
          }
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
            if (rowError) break;
            doc[colDef.field] = ids;
          }

        } else {
          const casted = castValue(rawValue, colDef.type);
          if (colDef.field === "name" && casted) hasName = true;
          if (casted !== undefined) doc[colDef.field] = casted;
        }
      }

      // Bỏ qua hàng trống (không có name)
      if (!hasName) continue;

      totalRows++;

      // Nếu dòng có lỗi ref lookup → đánh fail ngay chunk hiện tại
      if (rowError) {
        // Flush chunk đang chứa trước (nếu có) — không fail chunk vô tội
        if (chunkDocs.length > 0) {
          const result = await processChunk(Model, chunkDocs, currentChunkStart);
          result.success ? totalSuccessChunks++ : failedChunks.push({ rows: result.rows, reason: result.reason });
          chunkDocs = [];
        }
        // Đánh fail chunk 1 dòng này
        failedChunks.push({ rows: `${excelRowNum}`, reason: rowError });
        currentChunkStart = excelRowNum + 1;
        continue;
      }

      chunkDocs.push(doc);

      // Đủ CHUNK_SIZE hoặc hết file → xử lý chunk
      const isLast = i === dataRows.length - 1;
      if (chunkDocs.length === CHUNK_SIZE || (isLast && chunkDocs.length > 0)) {
        const result = await processChunk(Model, chunkDocs, currentChunkStart);
        result.success
          ? totalSuccessChunks++
          : failedChunks.push({ rows: result.rows, reason: result.reason });
        chunkDocs = [];
        currentChunkStart = excelRowNum + 1;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Import hoàn tất tiến trình",
      totalRows,
      totalSuccessChunks,
      totalFailedChunks: failedChunks.length,
      failedChunks,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { importHandler };
