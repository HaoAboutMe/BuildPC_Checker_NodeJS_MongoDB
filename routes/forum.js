const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const authMiddleware = require('../utils/authMiddleware');
const optionalAuthMiddleware = require('../utils/optionalAuthMiddleware');

/**
 * @swagger
 * tags:
 *   name: Forum
 *   description: Diễn đàn chia sẻ cấu hình PC
 */

/**
 * @swagger
 * /api/v1/forum/shared-builds:
 *   post:
 *     summary: Chia sẻ cấu hình PC lên diễn đàn
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - buildId
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               buildId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng bài thành công
 */
router.post('/shared-builds', authMiddleware, forumController.shareBuild);

/**
 * @swagger
 * /api/v1/forum/shared-builds:
 *   get:
 *     summary: Lấy danh sách bài đăng có phân trang
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Kích thước trang
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/shared-builds', optionalAuthMiddleware, forumController.getSharedBuilds);

/**
 * @swagger
 * /api/v1/forum/shared-builds/{id}:
 *   get:
 *     summary: Lấy chi tiết bài đăng theo ID
 *     tags: [Forum]
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
 *         description: Thành công
 */
router.get('/shared-builds/:id', optionalAuthMiddleware, forumController.getSharedBuildById);

/**
 * @swagger
 * /api/v1/forum/shared-builds/{id}/toggle-like:
 *   post:
 *     summary: Thích / Bỏ thích một bài đăng
 *     tags: [Forum]
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
 *         description: Thành công
 */
router.post('/shared-builds/:id/toggle-like', authMiddleware, forumController.toggleLikeSharedBuild);

/**
 * @swagger
 * /api/v1/forum/shared-builds/{id}/comments:
 *   post:
 *     summary: Thêm bình luận vào bài đăng
 *     tags: [Forum]
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
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bình luận thành công
 */
router.post('/shared-builds/:id/comments', authMiddleware, forumController.addComment);

/**
 * @swagger
 * /api/v1/forum/shared-builds/{id}/comments:
 *   get:
 *     summary: Lấy danh sách bình luận của bài đăng
 *     tags: [Forum]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/shared-builds/:id/comments', forumController.getComments);

module.exports = router;
