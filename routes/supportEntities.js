const express = require("express");
const router = express.Router();
const { isAdmin } = require("../utils/roleMiddleware");
const authMiddleware = require("../utils/authMiddleware");
const { body, param, validationResult } = require("express-validator");

// Schemas
const Socket = require("../schemas/socket");
const RamType = require("../schemas/ram-type");
const PcieVersion = require("../schemas/pcie-version");
const PcieConnector = require("../schemas/pcie-connector");
const CoolerType = require("../schemas/cooler-type");
const SsdType = require("../schemas/ssd-type");
const InterfaceType = require("../schemas/interface-type");
const FormFactor = require("../schemas/form-factor");
const CaseSize = require("../schemas/case-size");

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

// Generic CRUD Handlers
const getAllHandler = (Model) => async (req, res) => {
  try {
    const query = { isDeleted: false };
    let items = Model.find(query);
    if (Model.getPopulatePaths) items = items.populate(Model.getPopulatePaths());
    const data = await items;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createHandler = (Model, modelNameVi) => async (req, res) => {
  try {
    if (req.body.name) {
      const existing = await Model.findOne({ name: req.body.name, isDeleted: false });
      if (existing) return res.status(400).json({ success: false, message: `${modelNameVi} đã tồn tại` });
    }
    const newItem = new Model(req.body);
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getByIdHandler = (Model, modelNameVi) => async (req, res) => {
  try {
    let item = Model.findById(req.params.id);
    if (Model.getPopulatePaths) item = item.populate(Model.getPopulatePaths());
    const data = await item;
    if (!data || data.isDeleted) {
      return res.status(404).json({ success: false, message: `Không tìm thấy ${modelNameVi.toLowerCase()}` });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: `Không tìm thấy ${modelNameVi.toLowerCase()}` });
  }
};

const updateHandler = (Model, modelNameVi) => async (req, res) => {
  try {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item || item.isDeleted) {
      return res.status(404).json({ success: false, message: `Không tìm thấy ${modelNameVi.toLowerCase()}` });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteHandler = (Model, modelNameVi) => async (req, res) => {
  try {
    const item = await Model.findById(req.params.id);
    if (!item || item.isDeleted) {
      return res.status(404).json({ success: false, message: `Không tìm thấy ${modelNameVi.toLowerCase()}` });
    }
    item.isDeleted = true;
    await item.save();
    res.status(200).json({ success: true, message: `Đã xóa ${modelNameVi.toLowerCase()} thành công` });
  } catch (error) {
    res.status(404).json({ success: false, message: `Không tìm thấy ${modelNameVi.toLowerCase()}` });
  }
};

const entities = [
  { path: "sockets", model: Socket, nameVi: "Socket" },
  { path: "ram-types", model: RamType, nameVi: "Loại RAM" },
  { path: "pcie-versions", model: PcieVersion, nameVi: "Phiên bản PCIe" },
  { path: "pcie-connectors", model: PcieConnector, nameVi: "Đầu cấp nguồn PCIe" },
  { path: "cooler-types", model: CoolerType, nameVi: "Loại tản nhiệt" },
  { path: "ssd-types", model: SsdType, nameVi: "Loại SSD" },
  { path: "interface-types", model: InterfaceType, nameVi: "Giao tiếp" },
  { path: "form-factors", model: FormFactor, nameVi: "Kích thước chuẩn" },
  { path: "case-sizes", model: CaseSize, nameVi: "Kích cỡ vỏ case/mainboard" },
];

/**
 * @swagger
 * tags:
 *   name: Support Entities
 *   description: Category and management entities for PC parts
 */

/**
 * @swagger
 * /api/v1/support-entities/{entity}:
 *   get:
 *     summary: Get all items of a support entity
 *     tags: [Support Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sockets, ram-types, pcie-versions, pcie-connectors, cooler-types, ssd-types, interface-types, form-factors, case-sizes]
 *         description: The type of entity to retrieve
 *     responses:
 *       200:
 *         description: Success
 *   post:
 *     summary: Create a new item for a support entity
 *     tags: [Support Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sockets, ram-types, pcie-versions, pcie-connectors, cooler-types, ssd-types, interface-types, form-factors, case-sizes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "New Item Name" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/support-entities/{entity}/{id}:
 *   get:
 *     summary: Get detail by ID
 *     tags: [Support Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sockets, ram-types, pcie-versions, pcie-connectors, cooler-types, ssd-types, interface-types, form-factors, case-sizes]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *   put:
 *     summary: Update an item
 *     tags: [Support Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sockets, ram-types, pcie-versions, pcie-connectors, cooler-types, ssd-types, interface-types, form-factors, case-sizes]
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
 *               name: { type: string, example: "Updated Name" }
 *     responses:
 *       200:
 *         description: Updated successfully
 *   delete:
 *     summary: Soft delete an item
 *     tags: [Support Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sockets, ram-types, pcie-versions, pcie-connectors, cooler-types, ssd-types, interface-types, form-factors, case-sizes]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 */

entities.forEach((entity) => {
  router.get(`/${entity.path}`, getAllHandler(entity.model));
  router.post(
    `/${entity.path}`,
    [
      authMiddleware,
      isAdmin,
      body("name").notEmpty().withMessage("Tên không được để trống").trim(),
      validate,
    ],
    createHandler(entity.model, entity.nameVi)
  );
  router.get(
    `/${entity.path}/:id`,
    [param("id").isMongoId().withMessage("ID không hợp lệ"), validate],
    getByIdHandler(entity.model, entity.nameVi)
  );
  router.put(
    `/${entity.path}/:id`,
    [
      authMiddleware,
      isAdmin,
      param("id").isMongoId().withMessage("ID không hợp lệ"),
      body("name").optional().notEmpty().withMessage("Tên không được để trống"),
      validate,
    ],
    updateHandler(entity.model, entity.nameVi)
  );
  router.delete(
    `/${entity.path}/:id`,
    [
      authMiddleware,
      isAdmin,
      param("id").isMongoId().withMessage("ID không hợp lệ"),
      validate,
    ],
    deleteHandler(entity.model, entity.nameVi)
  );
});

module.exports = router;
