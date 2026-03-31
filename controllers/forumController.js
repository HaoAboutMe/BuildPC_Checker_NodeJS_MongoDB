const SharedBuild = require('../schemas/shared-build');
const SharedBuildComment = require('../schemas/shared-build-comment');
const Build = require('../schemas/build');
const mongoose = require('mongoose');

// Helper function để format response theo yêu cầu user
const formatSharedBuild = (sharedBuild, req) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  const build = sharedBuild.pcBuild || {};
  const user = sharedBuild.user || {};

  // Trích lục linh kiện vào phần 'parts'
  const parts = {};
  if (build.cpu) parts.cpu = build.cpu.name || build.cpu;
  if (build.mainboard) parts.mainboard = build.mainboard.name || build.mainboard;
  if (build.ram) parts.ram = `${build.ram.name || build.ram} (x${build.ramQuantity || 1})`;
  if (build.vga) parts.vga = build.vga.name || build.vga;
  if (build.psu) parts.psu = build.psu.name || build.psu;
  if (build.pcCase) parts.pcCase = build.pcCase.name || build.pcCase;
  if (build.cooler) parts.cooler = build.cooler.name || build.cooler;
  
  if (build.ssds && build.ssds.length > 0) {
    parts.ssds = build.ssds.map(s => s.name || s).join(', ');
  }
  if (build.hdds && build.hdds.length > 0) {
    parts.hdds = build.hdds.map(h => h.name || h).join(', ');
  }

  return {
    id: sharedBuild._id,
    title: sharedBuild.title,
    content: sharedBuild.content,
    likes: sharedBuild.likes ? sharedBuild.likes.length : 0,
    views: sharedBuild.views || 0,
    authorId: user._id || sharedBuild.user,
    authorUsername: user.username || 'N/A',
    shareLink: `${baseUrl}/api/v1/forum/shared-builds/${sharedBuild._id}`,
    build: {
      id: build._id,
      userId: build.user,
      name: build.name,
      description: build.description,
      parts: parts,
      createdAt: build.createdAt
    },
    createdAt: sharedBuild.createdAt
  };
};

// Chia sẻ cấu hình lên diễn đàn
exports.shareBuild = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { title, content, buildId } = req.body;

    if (!title || !content || !buildId) {
      return res.status(400).json({ code: 1, message: 'Vui lòng cung cấp đủ thông tin (title, content, buildId)', result: null });
    }

    // Kiểm tra build có tồn tại và thuộc về user đang đăng nhập không
    const buildCheck = await Build.findOne({ _id: buildId, user: userId });
    if (!buildCheck) {
      return res.status(404).json({ code: 1, message: 'Không tìm thấy cấu hình hoặc bạn không có quyền chia sẻ cấu hình này', result: null });
    }

    // Tạo bài đăng mới
    const sharedBuild = await SharedBuild.create({
      title,
      content,
      user: userId,
      pcBuild: buildId
    });

    // Populate để có đủ data format
    const populated = await SharedBuild.findById(sharedBuild._id)
      .populate('user', 'username email _id')
      .populate({
        path: 'pcBuild',
        populate: [
          { path: 'cpu' }, { path: 'mainboard' }, { path: 'ram' },
          { path: 'vga' }, { path: 'psu' }, { path: 'pcCase' },
          { path: 'cooler' }, { path: 'ssds' }, { path: 'hdds' }
        ]
      });

    res.status(201).json({
      code: 0,
      message: 'Chia sẻ cấu hình thành công',
      result: formatSharedBuild(populated, req)
    });
  } catch (error) {
    res.status(500).json({ code: 1, message: error.message, result: null });
  }
};

// Lấy danh sách bài chia sẻ (có phân trang và sắp xếp mới nhất)
exports.getSharedBuilds = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [builds, total] = await Promise.all([
      SharedBuild.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email _id')
        .populate({
           path: 'pcBuild',
           populate: [
            { path: 'cpu' }, { path: 'mainboard' }, { path: 'ram' },
            { path: 'vga' }, { path: 'psu' }, { path: 'pcCase' },
            { path: 'cooler' }, { path: 'ssds' }, { path: 'hdds' }
          ]
        }),
      SharedBuild.countDocuments()
    ]);

    const result = builds.map(b => formatSharedBuild(b, req));

    res.status(200).json({
      code: 0,
      message: 'Lấy danh sách thành công',
      result: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ code: 1, message: error.message, result: null });
  }
};

// Xem chi tiết bài chia sẻ (và tăng views)
exports.getSharedBuildById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ code: 1, message: 'ID không hợp lệ', result: null });
    }

    // Tăng view count và populate
    const build = await SharedBuild.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
    .populate('user', 'username email _id')
    .populate({
      path: 'pcBuild',
      populate: [
        { path: 'cpu' }, { path: 'mainboard' }, { path: 'ram' },
        { path: 'vga' }, { path: 'psu' }, { path: 'pcCase' },
        { path: 'cooler' }, { path: 'ssds' }, { path: 'hdds' }
      ]
    });

    if (!build) {
      return res.status(404).json({ code: 1, message: 'Không tìm thấy bài viết', result: null });
    }

    res.status(200).json({
      code: 0,
      message: 'Lấy chi tiết thành công',
      result: formatSharedBuild(build, req)
    });
  } catch (error) {
    res.status(500).json({ code: 1, message: error.message, result: null });
  }
};

// Like / Unlike bài viết
exports.toggleLikeSharedBuild = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ code: 1, message: 'ID không hợp lệ', result: null });
    }

    const build = await SharedBuild.findById(id);
    if (!build) {
      return res.status(404).json({ code: 1, message: 'Không tìm thấy bài viết', result: null });
    }

    const hasLiked = build.likes.includes(userId);
    let updateQuery;
    let message;

    if (hasLiked) {
      updateQuery = { $pull: { likes: userId } };
      message = 'Đã bỏ thích thành công';
    } else {
      updateQuery = { $addToSet: { likes: userId } };
      message = 'Đã thích thành công';
    }

    const updatedBuild = await SharedBuild.findByIdAndUpdate(id, updateQuery, { new: true });

    res.status(200).json({
      code: 0,
      message,
      result: {
        likeCount: updatedBuild.likes.length,
        isLiked: !hasLiked
      }
    });

  } catch (error) {
    res.status(500).json({ code: 1, message: error.message, result: null });
  }
};

// Thêm bình luận
exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user._id || req.user.id;

        if (!content) {
            return res.status(400).json({ code: 1, message: 'Nội dung bình luận là bắt buộc', result: null });
        }

        const buildExists = await SharedBuild.exists({ _id: id });
        if (!buildExists) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy bài viết', result: null });
        }

        const comment = await SharedBuildComment.create({
            content,
            user: userId,
            sharedBuild: id
        });

        await comment.populate('user', 'username email');

        res.status(201).json({
            code: 0,
            message: 'Đã thêm bình luận',
            result: comment
        });
    } catch (error) {
        res.status(500).json({ code: 1, message: error.message, result: null });
    }
};

// Lấy danh sách bình luận (có phân trang)
exports.getComments = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [comments, total] = await Promise.all([
            SharedBuildComment.find({ sharedBuild: id })
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'username email _id'),
            SharedBuildComment.countDocuments({ sharedBuild: id })
        ]);

        res.status(200).json({
            code: 0,
            message: 'Lấy bình luận thành công',
            result: comments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
         res.status(500).json({ code: 1, message: error.message, result: null });
    }
};
