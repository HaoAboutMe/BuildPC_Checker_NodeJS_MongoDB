const jwt = require('jsonwebtoken');
const userModel = require('../schemas/user');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng cung cấp mã xác thực (Token)'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kiểm tra trạng thái người dùng trong DB để xử lý Logout/Xóa tài khoản
    const user = await userModel.findById(decoded.id);
    
    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, message: 'Người dùng không tồn tại hoặc đã bị xóa' });
    }

    // Kiểm tra nếu token được tạo trước thời điểm Logout cuối cùng
    if (user.lastLogoutAt && decoded.iat * 1000 < user.lastLogoutAt.getTime()) {
      return res.status(401).json({ success: false, message: 'Phiên làm việc đã hết hạn sau khi đăng xuất. Vui lòng đăng nhập lại.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Mã xác thực không hợp lệ hoặc đã hết hạn'
    });
  }
};

module.exports = authMiddleware;
