const express = require('express');
const router = express.Router();
const buildService = require('../services/buildService');
const authMiddleware = require('../utils/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Builds
 *   description: PC Build compatibility and optimization
 */

/**
 * @swagger
 * /api/v1/builds/check-compatibility:
 *   post:
 *     summary: Kiểm tra tương thích phần cứng và gợi ý PSU
 *     tags: [Builds]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cpuId:
 *                 type: string
 *               mainboardId:
 *                 type: string
 *               ramId:
 *                 type: string
 *               ramQuantity:
 *                 type: integer
 *               vgaId:
 *                 type: string
 *               ssdIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               hddIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               psuId:
 *                 type: string
 *               caseId:
 *                 type: string
 *               coolerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trả về kết quả kiểm tra
 */
router.post('/check-compatibility', async (req, res) => {
  try {
    const build = req.body;
    const result = await buildService.checkCompatibility(build);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error in checkCompatibility:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/builds/check-bottleneck:
 *   post:
 *     summary: Kiểm tra nghẽn cổ chai (Bottleneck) CPU và GPU
 *     tags: [Builds]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cpuId
 *               - vgaId
 *             properties:
 *               cpuId:
 *                 type: string
 *               vgaId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trả về kết quả kiểm tra
 */
router.post('/check-bottleneck', async (req, res) => {
  try {
    const buildData = req.body;
    const result = await buildService.checkBottleneck(buildData);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error in checkBottleneck:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Có lỗi xảy ra khi kiểm tra nghẽn cổ chai'
    });
  }
});

/**
 * @swagger
 * /api/v1/builds/save-build:
 *   post:
 *     summary: Lưu cấu hình PC của người dùng
 *     tags: [Builds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Cấu hình Gaming 2024"
 *               description:
 *                 type: string
 *               cpuId:
 *                 type: string
 *               mainboardId:
 *                 type: string
 *               ramId:
 *                 type: string
 *               ramQuantity:
 *                 type: integer
 *               vgaId:
 *                 type: string
 *               ssdIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               hddIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               psuId:
 *                 type: string
 *               caseId:
 *                 type: string
 *               coolerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lưu thành công
 */
router.post('/save-build', authMiddleware, async (req, res) => {
  try {
    const buildData = req.body;
    const userId = req.user.id;
    const savedBuild = await buildService.saveBuild(userId, buildData);
    return res.status(201).json({
      success: true,
      message: "Lưu cấu hình thành công",
      data: savedBuild
    });
  } catch (error) {
    console.error('Error in saveBuild:', error);
    return res.status(400).json({
      success: false,
      message: error.message,
      ...(error.errors && error.errors.length > 0 && { errors: error.errors })
    });
  }
});

/**
 * @swagger
 * /api/v1/builds/my-builds:
 *   get:
 *     summary: Danh sách cấu hình của tôi
 *     tags: [Builds]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách cấu hình
 */
router.get('/my-builds', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const builds = await buildService.getUserBuilds(userId);
    return res.status(200).json({ success: true, data: builds });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/builds/my-builds/{id}:
 *   get:
 *     summary: Chi tiết cấu hình của tôi
 *     tags: [Builds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về chi tiết cấu hình
 */
router.get('/my-builds/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const buildId = req.params.id;
    const build = await buildService.getUserBuildById(userId, buildId);
    return res.status(200).json({ success: true, data: build });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/builds/my-builds/{id}:
 *   put:
 *     summary: Cập nhật cấu hình của tôi
 *     tags: [Builds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *             $ref: '#/components/schemas/BuildUpdate'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/my-builds/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const buildId = req.params.id;
    const buildData = req.body;
    const updatedBuild = await buildService.updateUserBuild(userId, buildId, buildData);
    return res.status(200).json({
      success: true,
      data: updatedBuild,
      message: "Cập nhật cấu hình thành công"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      ...(error.errors && error.errors.length > 0 && { errors: error.errors })
    });
  }
});

/**
 * @swagger
 * /api/v1/builds/my-builds/{id}:
 *   delete:
 *     summary: Xóa cấu hình của tôi
 *     tags: [Builds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/my-builds/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const buildId = req.params.id;
    await buildService.deleteUserBuild(userId, buildId);
    return res.status(200).json({ success: true, message: "Xóa cấu hình thành công" });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
});

module.exports = router;
