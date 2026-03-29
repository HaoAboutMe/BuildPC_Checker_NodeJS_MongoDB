const SharedBuild = require('../schemas/shared-build');
const SharedBuildComment = require('../schemas/shared-build-comment');
const Build = require('../schemas/build');
const mongoose = require('mongoose');

// Chia sẻ cấu hình lên diễn đàn
exports.shareBuild = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { title, content, buildId } = req.body;

    if (!title || !content || !buildId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin (title, content, buildId)' });
    }

    // Kiểm tra build có tồn tại và thuộc về user đang đăng nhập không
    const build = await Build.findOne({ _id: buildId, user: userId });
    if (!build) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cấu hình hoặc bạn không có quyền chia sẻ cấu hình này' });
    }

    // Tạo bài đăng mới
    const sharedBuild = await SharedBuild.create({
      title,
      content,
      user: userId,
      pcBuild: buildId
    });

    res.status(201).json({
      success: true,
      message: 'Chia sẻ cấu hình thành công',
      data: sharedBuild
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
           select: 'name totalPrice' // Có thể populate thêm detail linh kiện nếu cần view tóm tắt
        }),
      SharedBuild.countDocuments()
    ]);

    // Thêm belongsToUser để UI dễ xử lý nút xóa/sửa nếu cần (dựa trên token user)
    let currentUserId = null;
    if (req.user) {
        currentUserId = (req.user._id || req.user.id).toString();
    }
    
    // Convert to plain object để add thêm trường likeCount, isLiked
    const result = builds.map(b => {
        const buildObj = b.toObject();
        buildObj.likeCount = b.likes ? b.likes.length : 0;
        buildObj.isLiked = currentUserId ? (b.likes && b.likes.includes(currentUserId)) : false;
        return buildObj;
    });

    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xem chi tiết bài chia sẻ (và tăng views)
exports.getSharedBuildById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    // Tăng view count
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
        { path: 'vga' }, { path: 'psu' }, { path: 'case' },
        { path: 'cooler' }, { path: 'ssds' }, { path: 'hdds' }
      ]
    });

    if (!build) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    let currentUserId = null;
    if (req.user) {
        currentUserId = (req.user._id || req.user.id).toString();
    }
    
    const buildObj = build.toObject();
    buildObj.likeCount = build.likes ? build.likes.length : 0;
    buildObj.isLiked = currentUserId ? (build.likes && build.likes.includes(currentUserId)) : false;

    res.status(200).json({
      success: true,
      data: buildObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Like / Unlike bài viết
exports.toggleLikeSharedBuild = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const build = await SharedBuild.findById(id);
    if (!build) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    const hasLiked = build.likes.includes(userId);
    let updateQuery;
    let message;

    if (hasLiked) {
      // Bỏ like
      updateQuery = { $pull: { likes: userId } };
      message = 'Đã bỏ thích thành công';
    } else {
      // Like
      updateQuery = { $addToSet: { likes: userId } };
      message = 'Đã thích thành công';
    }

    const updatedBuild = await SharedBuild.findByIdAndUpdate(id, updateQuery, { new: true });

    res.status(200).json({
      success: true,
      message,
      data: {
        likeCount: updatedBuild.likes.length,
        isLiked: !hasLiked
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm bình luận
exports.addComment = async (req, res) => {
    try {
        const { id } = req.params; // Shared build id
        const { content } = req.body;
        const userId = req.user._id || req.user.id;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Nội dung bình luận là bắt buộc' });
        }

        const buildExists = await SharedBuild.exists({ _id: id });
        if (!buildExists) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        }

        const comment = await SharedBuildComment.create({
            content,
            user: userId,
            sharedBuild: id
        });

        // Populate user info before return
        await comment.populate('user', 'username email');

        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
                .sort({ createdAt: 1 }) // Sắp xếp cũ nhất trước, mới nhất sau (như chat) hoặc giảm dần tùy ý. Theo chuẩn FB là tăng dần
                .skip(skip)
                .limit(limit)
                .populate('user', 'username email _id'),
            SharedBuildComment.countDocuments({ sharedBuild: id })
        ]);

        res.status(200).json({
            success: true,
            data: comments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
         res.status(500).json({ success: false, message: error.message });
    }
};
