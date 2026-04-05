const express = require("express");
const mongoose = require("mongoose");
const { body, param, validationResult } = require("express-validator");
const Cpu = require("../schemas/cpu");
const Vga = require("../schemas/vga");
const Game = require("../schemas/game");
const authMiddleware = require("../utils/authMiddleware");
const { isAdmin } = require("../utils/roleMiddleware");

const router = express.Router();

const RESOLUTION_SCALE = {
  "1080p": 1.2,
  "2k": 1.0,
  "4k": 0.8,
};

function assertMongoId(id, fieldName) {
  if (!id || !mongoose.isValidObjectId(id)) {
    const err = new Error(`${fieldName} không hợp lệ`);
    err.status = 400;
    throw err;
  }
}

async function getCpuAndGpuScores({ cpuId, gpuId }) {
  assertMongoId(cpuId, "cpuId");
  assertMongoId(gpuId, "gpuId");

  const [cpu, gpu] = await Promise.all([
    Cpu.findOne({ _id: cpuId, isDeleted: false }).select("name score"),
    Vga.findOne({ _id: gpuId, isDeleted: false }).select("name score"),
  ]);

  if (!cpu) {
    const err = new Error("CPU không tồn tại");
    err.status = 404;
    throw err;
  }
  if (!gpu) {
    const err = new Error("GPU không tồn tại");
    err.status = 404;
    throw err;
  }

  return {
    cpu: { id: cpu._id.toString(), name: cpu.name, score: Number(cpu.score || 0) },
    gpu: { id: gpu._id.toString(), name: gpu.name, score: Number(gpu.score || 0) },
  };
}

function getCompatibilityStatus({ cpuScore, gpuScore, ramGb }, game) {
  const hasRam = typeof ramGb === "number";
  const passRec =
    cpuScore >= game.recCpuScore &&
    gpuScore >= game.recGpuScore &&
    (!hasRam || ramGb >= game.recRamGb);
  if (passRec) return "RECOMMENDED";

  const passMin =
    cpuScore >= game.minCpuScore &&
    gpuScore >= game.minGpuScore &&
    (!hasRam || ramGb >= game.minRamGb);
  if (passMin) return "MINIMUM";

  return "NOT_SUPPORTED";
}

function getCompatibilityMessage(status) {
  switch (status) {
    case "RECOMMENDED":
      return "Cấu hình của bạn đạt mức khuyến ngh�?";
    case "MINIMUM":
      return "Cấu hình của bạn đạt mức tối thiểu, trải nghiệm có th�?không ổn định.";
    default:
      return "Cấu hình của bạn không đáp ứng yêu cầu của game.";
  }
}

function estimateFpsForGame({ cpuScore, gpuScore, resolution }, game) {
  const resolutionScale = RESOLUTION_SCALE[resolution];
  if (!resolutionScale) {
    const err = new Error("resolution không hợp lệ");
    err.status = 400;
    throw err;
  }

  const limitingScore = Math.min(cpuScore, gpuScore);
  const referenceScore = Math.min(game.recCpuScore, game.recGpuScore);

  const ratio = referenceScore > 0 ? limitingScore / referenceScore : 0;

  const estimate = (baseFps) => {
    const raw = baseFps * ratio * resolutionScale;
    const capped = Math.min(raw, baseFps * 2);
    return Math.max(0, Math.round(capped));
  };

  const limitingComponent = cpuScore <= gpuScore ? "CPU" : "GPU";

  return {
    fps: {
      low: estimate(game.baseFpsLow),
      medium: estimate(game.baseFpsMedium),
      high: estimate(game.baseFpsHigh),
    },
    limitingComponent,
  };
}

async function checkAllGames({ cpuId, gpuId, ramGb }) {
  if (typeof ramGb !== "number" || Number.isNaN(ramGb) || ramGb <= 0) {
    const err = new Error("ramGb không hợp lệ");
    err.status = 400;
    throw err;
  }

  const { cpu, gpu } = await getCpuAndGpuScores({ cpuId, gpuId });
  const games = await Game.find({ isDeleted: false }).sort({ name: 1 }).select(
    "name minCpuScore minGpuScore minRamGb recCpuScore recGpuScore recRamGb",
  );

  return {
    pcSummary: {
      cpuScore: cpu.score,
      gpuScore: gpu.score,
      ramGb,
    },
    results: games.map((g) => {
      const status = getCompatibilityStatus(
        { cpuScore: cpu.score, gpuScore: gpu.score, ramGb },
        g,
      );
      return {
        gameId: g._id.toString(),
        name: g.name,
        status,
        message: getCompatibilityMessage(status),
      };
    }),
  };
}

async function checkSelectedGames({ cpuId, gpuId, gameIds }) {
  if (!Array.isArray(gameIds) || gameIds.length === 0) {
    const err = new Error("gameIds không hợp lệ");
    err.status = 400;
    throw err;
  }
  gameIds.forEach((id) => assertMongoId(id, "gameIds"));

  const { cpu, gpu } = await getCpuAndGpuScores({ cpuId, gpuId });
  const games = await Game.find({ _id: { $in: gameIds }, isDeleted: false }).select(
    "minCpuScore minGpuScore recCpuScore recGpuScore",
  );

  const found = new Set(games.map((g) => g._id.toString()));
  const missing = gameIds.filter((id) => !found.has(id));
  if (missing.length) {
    const err = new Error("Một hoặc nhiều gameIds không tồn tại");
    err.status = 404;
    throw err;
  }

  const byId = new Map(games.map((g) => [g._id.toString(), g]));
  return {
    results: gameIds.map((id) => {
      const game = byId.get(id);
      const status = getCompatibilityStatus(
        { cpuScore: cpu.score, gpuScore: gpu.score },
        game,
      );
      return { gameId: id, status };
    }),
  };
}

async function estimateFps({ cpuId, gpuId, gameIds, resolution }) {
  if (!Array.isArray(gameIds) || gameIds.length === 0) {
    const err = new Error("gameIds không hợp lệ");
    err.status = 400;
    throw err;
  }
  gameIds.forEach((id) => assertMongoId(id, "gameIds"));

  const { cpu, gpu } = await getCpuAndGpuScores({ cpuId, gpuId });
  const games = await Game.find({ _id: { $in: gameIds }, isDeleted: false }).select(
    "name recCpuScore recGpuScore baseFpsLow baseFpsMedium baseFpsHigh",
  );

  const found = new Set(games.map((g) => g._id.toString()));
  const missing = gameIds.filter((id) => !found.has(id));
  if (missing.length) {
    const err = new Error("Một hoặc nhiều gameIds không tồn tại");
    err.status = 404;
    throw err;
  }

  const byId = new Map(games.map((g) => [g._id.toString(), g]));

  return {
    results: gameIds.map((id) => {
      const game = byId.get(id);
      const { fps, limitingComponent } = estimateFpsForGame(
        { cpuScore: cpu.score, gpuScore: gpu.score, resolution },
        game,
      );
      return {
        gameId: id,
        name: game.name,
        fps,
        limitingComponent,
      };
    }),
  };
}

async function listGames() {
  return Game.find({ isDeleted: false }).sort({ name: 1 });
}

async function getGameById(id) {
  assertMongoId(id, "id");
  const game = await Game.findOne({ _id: id, isDeleted: false });
  if (!game) {
    const err = new Error("Game không tồn tại");
    err.status = 404;
    throw err;
  }
  return game;
}

async function createGame(payload) {
  return Game.create({ ...payload, isDeleted: false });
}

async function updateGame(id, payload) {
  assertMongoId(id, "id");
  const updated = await Game.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: payload },
    { new: true, runValidators: true },
  );
  if (!updated) {
    const err = new Error("Game không tồn tại");
    err.status = 404;
    throw err;
  }
  return updated;
}

async function deleteGame(id) {
  assertMongoId(id, "id");
  const updated = await Game.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true },
  );
  if (!updated) {
    const err = new Error("Game không tồn tại");
    err.status = 404;
    throw err;
  }
  return true;
}

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Games
 *   description: Game compatibility and FPS estimation
 */

/**
 * @swagger
 * /api/v1/games:
 *   get:
 *     summary: Get all games
 *     tags: [Games]
 *     security: []
 *     responses:
 *       200:
 *         description: Game list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string, example: "67f0a1b2c3d4e5f678901234" }
 *                       name: { type: string, example: "Cyberpunk 2077" }
 *                       coverImageUrl: { type: string, example: "" }
 *                       minCpuScore: { type: number, example: 13000 }
 *                       minGpuScore: { type: number, example: 14000 }
 *                       minRamGb: { type: number, example: 12 }
 *                       recCpuScore: { type: number, example: 20000 }
 *                       recGpuScore: { type: number, example: 22000 }
 *                       recRamGb: { type: number, example: 16 }
 *                       baseFpsLow: { type: number, example: 80 }
 *                       baseFpsMedium: { type: number, example: 60 }
 *                       baseFpsHigh: { type: number, example: 45 }
 */
router.get("/", async (req, res) => {
  try {
    const games = await listGames();
    return res.status(200).json({ success: true, data: games });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Có lỗi xảy ra",
    });
  }
});

/**
 * @swagger
 * /api/v1/games/{id}:
 *   get:
 *     summary: Get game detail by ID
 *     tags: [Games]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Game detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *       404:
 *         description: Game not found
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("ID không hợp lệ"), validate],
  async (req, res) => {
    try {
      const game = await getGameById(req.params.id);
      return res.status(200).json({ success: true, data: game });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  },
);

/**
 * @swagger
 * /api/v1/games:
 *   post:
 *     summary: Create a new game (Admin)
 *     tags: [Games]
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
 *               - minCpuScore
 *               - minGpuScore
 *               - minRamGb
 *               - recCpuScore
 *               - recGpuScore
 *               - recRamGb
 *               - baseFpsLow
 *               - baseFpsMedium
 *               - baseFpsHigh
 *             properties:
 *               name: { type: string, example: "New Game" }
 *               coverImageUrl: { type: string, example: "" }
 *               minCpuScore: { type: number, example: 10000 }
 *               minGpuScore: { type: number, example: 10000 }
 *               minRamGb: { type: number, example: 8 }
 *               recCpuScore: { type: number, example: 15000 }
 *               recGpuScore: { type: number, example: 17000 }
 *               recRamGb: { type: number, example: 16 }
 *               baseFpsLow: { type: number, example: 90 }
 *               baseFpsMedium: { type: number, example: 70 }
 *               baseFpsHigh: { type: number, example: 55 }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Invalid input
 */
router.post(
  "/",
  [
    authMiddleware,
    isAdmin,
    body("name").notEmpty().withMessage("name không được đ�?trống").trim(),
    body("coverImageUrl").optional().isString().trim(),
    body("minCpuScore").isNumeric().withMessage("minCpuScore không hợp lệ"),
    body("minGpuScore").isNumeric().withMessage("minGpuScore không hợp lệ"),
    body("minRamGb").isNumeric().withMessage("minRamGb không hợp lệ"),
    body("recCpuScore").isNumeric().withMessage("recCpuScore không hợp lệ"),
    body("recGpuScore").isNumeric().withMessage("recGpuScore không hợp lệ"),
    body("recRamGb").isNumeric().withMessage("recRamGb không hợp lệ"),
    body("baseFpsLow").isNumeric().withMessage("baseFpsLow không hợp lệ"),
    body("baseFpsMedium").isNumeric().withMessage("baseFpsMedium không hợp lệ"),
    body("baseFpsHigh").isNumeric().withMessage("baseFpsHigh không hợp lệ"),
    validate,
  ],
  async (req, res) => {
    try {
      const created = await createGame(req.body);
      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  },
);

/**
 * @swagger
 * /api/v1/games/{id}:
 *   put:
 *     summary: Update a game (Admin)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Updated Game" }
 *               coverImageUrl: { type: string, example: "" }
 *               minCpuScore: { type: number, example: 10000 }
 *               minGpuScore: { type: number, example: 10000 }
 *               minRamGb: { type: number, example: 8 }
 *               recCpuScore: { type: number, example: 15000 }
 *               recGpuScore: { type: number, example: 17000 }
 *               recRamGb: { type: number, example: 16 }
 *               baseFpsLow: { type: number, example: 90 }
 *               baseFpsMedium: { type: number, example: 70 }
 *               baseFpsHigh: { type: number, example: 55 }
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Game not found
 */
router.put(
  "/:id",
  [
    authMiddleware,
    isAdmin,
    param("id").isMongoId().withMessage("ID không hợp lệ"),
    body("name").optional().notEmpty().withMessage("name không được đ�?trống").trim(),
    body("coverImageUrl").optional().isString().trim(),
    body("minCpuScore").optional().isNumeric().withMessage("minCpuScore không hợp lệ"),
    body("minGpuScore").optional().isNumeric().withMessage("minGpuScore không hợp lệ"),
    body("minRamGb").optional().isNumeric().withMessage("minRamGb không hợp lệ"),
    body("recCpuScore").optional().isNumeric().withMessage("recCpuScore không hợp lệ"),
    body("recGpuScore").optional().isNumeric().withMessage("recGpuScore không hợp lệ"),
    body("recRamGb").optional().isNumeric().withMessage("recRamGb không hợp lệ"),
    body("baseFpsLow").optional().isNumeric().withMessage("baseFpsLow không hợp lệ"),
    body("baseFpsMedium").optional().isNumeric().withMessage("baseFpsMedium không hợp lệ"),
    body("baseFpsHigh").optional().isNumeric().withMessage("baseFpsHigh không hợp lệ"),
    validate,
  ],
  async (req, res) => {
    try {
      const updated = await updateGame(req.params.id, req.body);
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  },
);

/**
 * @swagger
 * /api/v1/games/{id}:
 *   delete:
 *     summary: Delete a game (soft delete, Admin)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Game not found
 */
router.delete(
  "/:id",
  [
    authMiddleware,
    isAdmin,
    param("id").isMongoId().withMessage("ID không hợp lệ"),
    validate,
  ],
  async (req, res) => {
    try {
      await deleteGame(req.params.id);
      return res.status(200).json({ success: true, message: "Xóa game thành công" });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  },
);

/**
 * @swagger
 * /api/v1/games/check-all:
 *   post:
 *     summary: Check compatibility for ALL games
 *     tags: [Games]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cpuId, gpuId, ramGb]
 *             properties:
 *               cpuId: { type: string, example: "65cb7e2c0d0d0d0d0d0d0d0d" }
 *               gpuId: { type: string, example: "65cb7e2c0d0d0d0d0d0d0d0e" }
 *               ramGb: { type: number, example: 32 }
 *     responses:
 *       200:
 *         description: Compatibility results for all games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pcSummary:
 *                   type: object
 *                   properties:
 *                     cpuScore: { type: number, example: 18500 }
 *                     gpuScore: { type: number, example: 21000 }
 *                     ramGb: { type: number, example: 32 }
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       gameId: { type: string, example: "67f0a1b2c3d4e5f678901234" }
 *                       name: { type: string, example: "Cyberpunk 2077" }
 *                       status:
 *                         type: string
 *                         enum: [RECOMMENDED, MINIMUM, NOT_SUPPORTED]
 *                         example: RECOMMENDED
 *                       message: { type: string, example: "Cấu hình của bạn đạt mức khuyến ngh�?" }
 *       400:
 *         description: Invalid input
 *       404:
 *         description: CPU/GPU not found
 */
router.post(
  "/check-all",
  [
    body("cpuId").isMongoId().withMessage("cpuId không hợp lệ"),
    body("gpuId").isMongoId().withMessage("gpuId không hợp lệ"),
    body("ramGb").isNumeric().withMessage("ramGb không hợp lệ"),
    validate,
  ],
  async (req, res) => {
    try {
      const { cpuId, gpuId, ramGb } = req.body;
      const data = await checkAllGames({
        cpuId,
        gpuId,
        ramGb: Number(ramGb),
      });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  },
);

/**
 * @swagger
 * /api/v1/games/check-selected:
 *   post:
 *     summary: Check compatibility for selected games
 *     tags: [Games]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cpuId, gpuId, gameIds]
 *             properties:
 *               cpuId: { type: string, example: "65cb7e2c0d0d0d0d0d0d0d0d" }
 *               gpuId: { type: string, example: "65cb7e2c0d0d0d0d0d0d0d0e" }
 *               gameIds:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["67f0a1b2c3d4e5f678901234", "67f0a1b2c3d4e5f678901235"]
 *     responses:
 *       200:
 *         description: Compatibility results for selected games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       gameId: { type: string, example: "67f0a1b2c3d4e5f678901234" }
 *                       status:
 *                         type: string
 *                         enum: [RECOMMENDED, MINIMUM, NOT_SUPPORTED]
 *                         example: MINIMUM
 *       400:
 *         description: Invalid input
 *       404:
 *         description: CPU/GPU/Game not found
 */
router.post(
  "/check-selected",
  [
    body("cpuId").isMongoId().withMessage("cpuId không hợp lệ"),
    body("gpuId").isMongoId().withMessage("gpuId không hợp lệ"),
    body("gameIds").isArray({ min: 1 }).withMessage("gameIds không hợp lệ"),
    body("gameIds.*").isMongoId().withMessage("gameIds chứa ID không hợp lệ"),
    validate,
  ],
  async (req, res) => {
    try {
      const { cpuId, gpuId, gameIds } = req.body;
      const data = await checkSelectedGames({ cpuId, gpuId, gameIds });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  },
);

/**
 * @swagger
 * /api/v1/games/estimate-fps:
 *   post:
 *     summary: Estimate FPS for selected games
 *     tags: [Games]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cpuId, gpuId, gameIds, resolution]
 *             properties:
 *               cpuId: { type: string, example: "65cb7e2c0d0d0d0d0d0d0d0d" }
 *               gpuId: { type: string, example: "65cb7e2c0d0d0d0d0d0d0d0e" }
 *               gameIds:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["67f0a1b2c3d4e5f678901234"]
 *               resolution:
 *                 type: string
 *                 enum: ["1080p", "2k", "4k"]
 *                 example: "1080p"
 *     responses:
 *       200:
 *         description: FPS estimation results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       gameId: { type: string, example: "67f0a1b2c3d4e5f678901234" }
 *                       name: { type: string, example: "Elden Ring" }
 *                       fps:
 *                         type: object
 *                         properties:
 *                           low: { type: number, example: 92 }
 *                           medium: { type: number, example: 70 }
 *                           high: { type: number, example: 54 }
 *                       limitingComponent:
 *                         type: string
 *                         enum: [CPU, GPU]
 *                         example: CPU
 *       400:
 *         description: Invalid input
 *       404:
 *         description: CPU/GPU/Game not found
 */
router.post(
  "/estimate-fps",
  [
    body("cpuId").isMongoId().withMessage("cpuId không hợp lệ"),
    body("gpuId").isMongoId().withMessage("gpuId không hợp lệ"),
    body("gameIds").isArray({ min: 1 }).withMessage("gameIds không hợp lệ"),
    body("gameIds.*").isMongoId().withMessage("gameIds chứa ID không hợp lệ"),
    body("resolution")
      .isIn(["1080p", "2k", "4k"])
      .withMessage("resolution không hợp lệ"),
    validate,
  ],
  async (req, res) => {
    try {
      const { cpuId, gpuId, gameIds, resolution } = req.body;
      const data = await estimateFps({ cpuId, gpuId, gameIds, resolution });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  },
);

module.exports = router;
