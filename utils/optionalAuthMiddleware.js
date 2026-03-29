const jwt = require('jsonwebtoken');
const User = require('../schemas/user');

const optionalAuthMiddleware = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(); // Không có token, bỏ qua và đi tiếp
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user) {
            req.user = user;
        }
        next();
    } catch (error) {
        // Token hết hạn hoặc sai thì kệ, coi như không đăng nhập
        next();
    }
};

module.exports = optionalAuthMiddleware;
