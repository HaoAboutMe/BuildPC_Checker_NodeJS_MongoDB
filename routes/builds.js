const express = require('express');
const router = express.Router();
const buildController = require('../controllers/buildController');

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
 *                 example: "65cb7e2c..."
 *               mainboardId:
 *                 type: string
 *               ramId:
 *                 type: string
 *               ramQuantity:
 *                 type: integer
 *                 default: 1
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     compatible:
 *                       type: boolean
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommendedPsuWattage:
 *                       type: number
 */
router.post('/check-compatibility', buildController.checkCompatibility);

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
 *         description: Trả về kết quả kiểm tra nghẽn cổ chai cho 3 độ phân giải
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cpu:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         score:
 *                           type: number
 *                     gpu:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         score:
 *                           type: number
 *                     results:
 *                       type: object
 *                       properties:
 *                         1080p:
 *                           $ref: '#/components/schemas/BottleneckResult'
 *                         2k:
 *                           $ref: '#/components/schemas/BottleneckResult'
 *                         4k:
 *                           $ref: '#/components/schemas/BottleneckResult'
 */
router.post('/check-bottleneck', buildController.checkBottleneck);


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
 *                 example: "Cấu hình tối ưu cho Cyberpunk 2077"
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
 *       400:
 *         description: Lỗi tương thích hoặc thiếu dữ liệu
 *       401:
 *         description: Chưa đăng nhập
 */
const authMiddleware = require('../utils/authMiddleware');
router.post('/save-build', authMiddleware, buildController.saveBuild);

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
router.get('/my-builds', authMiddleware, buildController.getAllMyBuilds);

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
router.get('/my-builds/:id', authMiddleware, buildController.getMyBuildById);

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
router.put('/my-builds/:id', authMiddleware, buildController.updateMyBuild);

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
router.delete('/my-builds/:id', authMiddleware, buildController.deleteMyBuild);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     BottleneckResult:
 *       type: object
 *       properties:
 *         bottleneck:
 *           type: boolean
 *         type:
 *           type: string
 *           enum: [CPU, GPU, NONE, UNKNOWN]
 *         severity:
 *           type: string
 *           enum: [NONE, LOW, MEDIUM, HIGH]
 *         ratio:
 *           type: number
 *         message:
 *           type: string
 */

