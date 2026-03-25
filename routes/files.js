var express = require("express");
var router = express.Router();
const FileController = require("../controllers/fileController");
const authMiddleware = require("../utils/authMiddleware");

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
  FileController.uploadMiddleware,
  FileController.uploadImage,
);

module.exports = router;
