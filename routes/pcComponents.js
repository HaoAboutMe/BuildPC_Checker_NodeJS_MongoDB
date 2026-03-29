const express = require("express");
const router = express.Router();
const pcComponentController = require("../controllers/pcComponentController");
const { isAdmin } = require("../utils/roleMiddleware");
const authMiddleware = require("../utils/authMiddleware");
const { body, param, validationResult } = require("express-validator");


// Common middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

const components = [
  {
    path: "cpus",
    controller: pcComponentController.cpuController,
    refs: ["socket", "pcieVersion"],
  },
  {
    path: "mainboards",
    controller: pcComponentController.mainboardController,
    refs: ["socket", "ramType", "size", "pcieVgaVersion"],
  },
  {
    path: "rams",
    controller: pcComponentController.ramController,
    refs: ["ramType"],
  },
  {
    path: "vgas",
    controller: pcComponentController.vgaController,
    refs: ["pcieVersion", "powerConnector"],
  },
  {
    path: "ssds",
    controller: pcComponentController.ssdController,
    refs: ["ssdType", "formFactor", "interfaceType"],
  },
  {
    path: "hdds",
    controller: pcComponentController.hddController,
    refs: ["formFactor", "interfaceType"],
  },
  {
    path: "psus",
    controller: pcComponentController.psuController,
    refs: ["pcieConnectors"], // pcieConnectors is an array
  },
  {
    path: "pc-cases",
    controller: pcComponentController.pcCaseController,
    refs: ["size"],
  },
  {
    path: "coolers",
    controller: pcComponentController.coolerController,
    refs: ["coolerType"],
  },
];

/**
 * @swagger
 * tags:
 *   name: PC Components
 *   description: Management for PC hardware components
 */

/**
 * @swagger
 * /api/v1/pc-components/import:
 *   post:
 *     summary: Import linh kiện PC từ file Excel (Chunk-level Transaction)
 *     tags: [PC Components]
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
 *       - in: query
 *         name: socket
 *         schema: { type: string }
 *         description: "ObjectId của Socket (bắt buộc cho cpu, mainboard)"
 *       - in: query
 *         name: pcieVersion
 *         schema: { type: string }
 *         description: "ObjectId của PcieVersion (bắt buộc cho cpu, vga)"
 *       - in: query
 *         name: ramType
 *         schema: { type: string }
 *         description: "ObjectId của RamType (bắt buộc cho ram, mainboard)"
 *       - in: query
 *         name: powerConnector
 *         schema: { type: string }
 *         description: "ObjectId của PcieConnector (bắt buộc cho vga)"
 *       - in: query
 *         name: ssdType
 *         schema: { type: string }
 *         description: "ObjectId của SsdType (bắt buộc cho ssd)"
 *       - in: query
 *         name: formFactor
 *         schema: { type: string }
 *         description: "ObjectId của FormFactor (bắt buộc cho ssd, hdd)"
 *       - in: query
 *         name: interfaceType
 *         schema: { type: string }
 *         description: "ObjectId của InterfaceType (bắt buộc cho ssd, hdd)"
 *       - in: query
 *         name: size
 *         schema: { type: string }
 *         description: "ObjectId của CaseSize (bắt buộc cho mainboard, pc-case)"
 *       - in: query
 *         name: pcieVgaVersion
 *         schema: { type: string }
 *         description: "ObjectId của PcieVersion cho VGA slot (bắt buộc cho mainboard)"
 *       - in: query
 *         name: coolerType
 *         schema: { type: string }
 *         description: "ObjectId của CoolerType (bắt buộc cho cooler)"
 *       - in: query
 *         name: pcieConnectors
 *         schema: { type: string }
 *         description: "Danh sách ObjectId của PcieConnector, ngăn cách bằng dấu phẩy (tuỳ chọn cho psu)"
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
 *                 description: File Excel (.xlsx) chứa dữ liệu linh kiện (Row 1 là header, Row 2 trở đi là dữ liệu)
 *     responses:
 *       200:
 *         description: Import hoàn tất (có thể có chunk thất bại)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Import hoàn tất tiến trình" }
 *                 totalRows: { type: number, example: 120 }
 *                 totalSuccessChunks: { type: number, example: 2 }
 *                 totalFailedChunks: { type: number, example: 1 }
 *                 failedChunks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rows: { type: string, example: "52-101" }
 *                       reason: { type: string, example: "E11000 duplicate key error" }
 *       400:
 *         description: Thiếu file, sai loại file, hoặc thiếu query param bắt buộc
 */

/**
 * @swagger
 * /api/v1/pc-components/cpus:
 *   post:
 *     summary: Create a new CPU
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Intel Core i5-12400F" }
 *               socket: { type: string, description: "ObjectId of Socket", example: "65f..." }
 *               vrmMin: { type: number, example: 4 }
 *               igpu: { type: boolean, example: false }
 *               tdp: { type: number, example: 65 }
 *               pcieVersion: { type: string, description: "ObjectId of PcieVersion", example: "65f..." }
 *               score: { type: number, example: 19000 }
 *               imageUrl: { type: string, example: "" }
 *               description: { type: string, example: "" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/pc-components/mainboards:
 *   post:
 *     summary: Create a new Mainboard
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "ASUS TUF GAMING B760M-PLUS" }
 *               socket: { type: string, description: "ObjectId of Socket", example: "65f..." }
 *               vrmPhase: { type: number, example: 12 }
 *               cpuTdpSupport: { type: number, example: 250 }
 *               ramType: { type: string, description: "ObjectId of RamType", example: "65f..." }
 *               ramBusMax: { type: number, example: 7200 }
 *               ramSlot: { type: number, example: 4 }
 *               ramMaxCapacity: { type: number, example: 192 }
 *               size: { type: string, description: "ObjectId of CaseSize", example: "65f..." }
 *               pcieVgaVersion: { type: string, description: "ObjectId of PcieVersion", example: "65f..." }
 *               m2Slot: { type: number, example: 2 }
 *               sataSlot: { type: number, example: 4 }
 *               imageUrl: { type: string, example: "" }
 *               description: { type: string, example: "" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/pc-components/rams:
 *   post:
 *     summary: Create a new RAM
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz" }
 *               ramType: { type: string, description: "ObjectId of RamType", example: "65f..." }
 *               ramBus: { type: number, example: 6000 }
 *               ramCas: { type: number, example: 36 }
 *               capacityPerStick: { type: number, example: 16 }
 *               quantity: { type: number, example: 2 }
 *               tdp: { type: number, example: 5 }
 *               imageUrl: { type: string, example: "" }
 *               description: { type: string, example: "" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/pc-components/vgas:
 *   post:
 *     summary: Create a new VGA
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "NVIDIA GeForce RTX 4070 SUPER" }
 *               lengthMm: { type: number, example: 267 }
 *               tdp: { type: number, example: 220 }
 *               pcieVersion: { type: string, description: "ObjectId of PcieVersion", example: "65f..." }
 *               powerConnector: { type: string, description: "ObjectId of PcieConnector", example: "65f..." }
 *               score: { type: number, example: 31000 }
 *               imageUrl: { type: string, example: "" }
 *               description: { type: string, example: "" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/pc-components/ssds:
 *   post:
 *     summary: Create a new SSD
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Samsung 990 Pro 1TB" }
 *               ssdType: { type: string, description: "ObjectId of SsdType", example: "65f..." }
 *               formFactor: { type: string, description: "ObjectId of FormFactor", example: "65f..." }
 *               interfaceType: { type: string, description: "ObjectId of InterfaceType", example: "65f..." }
 *               capacity: { type: number, example: 1024 }
 *               tdp: { type: number, example: 7 }
 *               imageUrl: { type: string, example: "" }
 *               description: { type: string, example: "" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/pc-components/hdds:
 *   post:
 *     summary: Create a new HDD
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Seagate BarraCuda 2TB" }
 *               formFactor: { type: string, description: "ObjectId of FormFactor", example: "65f..." }
 *               interfaceType: { type: string, description: "ObjectId of InterfaceType", example: "65f..." }
 *               capacity: { type: number, example: 2048 }
 *               tdp: { type: number, example: 15 }
 *               imageUrl: { type: string, example: "" }
 *               description: { type: string, example: "" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/pc-components/psus:
 *   post:
 *     summary: Create a new PSU
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Corsair RM850x 850W" }
 *               wattage: { type: number, example: 850 }
 *               efficiency: { type: string, example: "80 Plus Gold" }
 *               pcieConnectors: { type: array, items: { type: string }, example: ["65f..."] }
 *               sataConnector: { type: number, example: 8 }
 *               imageUrl: { type: string, example: "" }
 *               description: { type: string, example: "" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/pc-components/pc-cases:
 *   post:
 *     summary: Create a new PC Case
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "NZXT H5 Flow" }
 *               size: { type: string, description: "ObjectId of CaseSize", example: "65f..." }
 *               maxVgaLengthMm: { type: number, example: 365 }
 *               maxCoolerHeightMm: { type: number, example: 165 }
 *               maxRadiatorSize: { type: number, example: 280 }
 *               drive35Slot: { type: number, example: 1 }
 *               drive25Slot: { type: number, example: 2 }
 *               imageUrl: { type: string, example: "" }
 *               description: { type: string, example: "" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/pc-components/coolers:
 *   post:
 *     summary: Create a new Cooler
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "DeepCool AK620 Digital" }
 *               coolerType: { type: string, description: "ObjectId of CoolerType", example: "65f..." }
 *               radiatorSize: { type: number, example: 0 }
 *               heightMm: { type: number, example: 162 }
 *               tdpSupport: { type: number, example: 260 }
 *               imageUrl: { type: string, example: "" }
 *               description: { type: string, example: "" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/pc-components/{component}:
 *   get:
 *     summary: Get all items of a PC component
 *     tags: [PC Components]
 *     parameters:
 *       - in: path
 *         name: component
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cpus, mainboards, rams, vgas, ssds, hdds, psus, pc-cases, coolers]
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * @swagger
 * /api/v1/pc-components/{component}/{id}:
 *   get:
 *     summary: Get component detail by ID
 *     tags: [PC Components]
 *     parameters:
 *       - in: path
 *         name: component
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cpus, mainboards, rams, vgas, ssds, hdds, psus, pc-cases, coolers]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *   put:
 *     summary: Update a PC component
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: component
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cpus, mainboards, rams, vgas, ssds, hdds, psus, pc-cases, coolers]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Updated Product Name" }
 *               description: { type: string, example: "Updated description" }
 *               # Note: Specific fields depend on the component type
 *     responses:
 *       200:
 *         description: Updated successfully
 *   delete:
 *     summary: Soft delete a component
 *     tags: [PC Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: component
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cpus, mainboards, rams, vgas, ssds, hdds, psus, pc-cases, coolers]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
components.forEach((comp) => {
  // Tạo danh sách validate cho các trường tham chiếu
  const refValidators = (comp.refs || []).map((field) => {
    if (field === "pcieConnectors") {
      // Trường hợp đặc biệt là mảng các ID (PSU)
      return body(field)
        .optional()
        .custom((value) => {
          if (!Array.isArray(value)) return true;
          return value.every((v) => /^[0-9a-fA-F]{24}$/.test(v));
        })
        .withMessage(`${field} phải là mảng các ID hợp lệ`);
    }
    return body(field)
      .optional()
      .isMongoId()
      .withMessage(`${field} của bạn không phải là ID hợp lệ`);
  });

  router.get(`/${comp.path}`, comp.controller.getAll);
  router.post(
    `/${comp.path}`,
    [
      authMiddleware,
      isAdmin,
      body("name").notEmpty().withMessage("Tên không được để trống").trim(),
      ...refValidators,
      validate,
    ],
    comp.controller.create,
  );
  router.get(
    `/${comp.path}/:id`,
    [param("id").isMongoId().withMessage("ID không hợp lệ"), validate],
    comp.controller.getById,
  );
  router.put(
    `/${comp.path}/:id`,
    [
      authMiddleware,
      isAdmin,
      param("id").isMongoId().withMessage("ID không hợp lệ"),
      body("name").optional().notEmpty().withMessage("Tên không được để trống"),
      ...refValidators,
      validate,
    ],
    comp.controller.update,
  );
  router.delete(
    `/${comp.path}/:id`,
    [
      authMiddleware,
      isAdmin,
      param("id").isMongoId().withMessage("ID không hợp lệ"),
      validate,
    ],
    comp.controller.delete,
  );
});

module.exports = router;
