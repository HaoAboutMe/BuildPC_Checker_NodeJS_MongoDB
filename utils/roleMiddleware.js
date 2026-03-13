const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Quyền truy cập bị từ chối. Chỉ dành cho Admin.'
  });
};

const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }

  // Cho phép nếu là Admin hoặc chính chủ sở hữu ID trong params
  if (req.user.role === 'admin' || req.user.id === req.params.id) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Bạn không có quyền truy cập thông tin của người khác'
  });
};

module.exports = { isAdmin, isOwnerOrAdmin };
