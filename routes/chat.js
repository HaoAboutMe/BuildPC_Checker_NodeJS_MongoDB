const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../utils/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: API hỗ trợ cho tính năng nhắn tin (lấy lịch sử, ds người chat)
 */

/**
 * @swagger
 * /api/v1/chat/contacts:
 *   get:
 *     summary: Lấy danh sách những người đã từng chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/contacts', authMiddleware, chatController.getChatContacts);

/**
 * @swagger
 * /api/v1/chat/history/{withUserId}:
 *   get:
 *     summary: Lấy lịch sử chat với 1 user cụ thể
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: withUserId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số tin nhắn mỗi trang (Mặc định 50)
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/history/:withUserId', authMiddleware, chatController.getChatHistory);

module.exports = router;
