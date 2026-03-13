const express = require("express");
const router = express.Router();
const supportEntityController = require("../controllers/supportEntityController");
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

const entities = [
  { path: "sockets", controller: supportEntityController.socketController },
  { path: "ram-types", controller: supportEntityController.ramTypeController },
  {
    path: "pcie-versions",
    controller: supportEntityController.pcieVersionController,
  },
  {
    path: "pcie-connectors",
    controller: supportEntityController.pcieConnectorController,
  },
  {
    path: "cooler-types",
    controller: supportEntityController.coolerTypeController,
  },
  { path: "ssd-types", controller: supportEntityController.ssdTypeController },
  {
    path: "interface-types",
    controller: supportEntityController.interfaceTypeController,
  },
  {
    path: "form-factors",
    controller: supportEntityController.formFactorController,
  },
  {
    path: "case-sizes",
    controller: supportEntityController.caseSizeController,
  },
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
  router.get(`/${entity.path}`, entity.controller.getAll);
  router.post(
    `/${entity.path}`,
    [
      authMiddleware,
      isAdmin,
      body("name").notEmpty().withMessage("Tên không được để trống").trim(),
      validate,
    ],
    entity.controller.create,
  );
  router.get(
    `/${entity.path}/:id`,
    [param("id").isMongoId().withMessage("ID không hợp lệ"), validate],
    entity.controller.getById,
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
    entity.controller.update,
  );
  router.delete(
    `/${entity.path}/:id`,
    [
      authMiddleware,
      isAdmin,
      param("id").isMongoId().withMessage("ID không hợp lệ"),
      validate,
    ],
    entity.controller.delete,
  );
});

module.exports = router;
