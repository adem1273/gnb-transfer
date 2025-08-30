// authMiddleware.js - GNB Pro Final
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token doğrulama ve kullanıcı yükleme
exports.verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password'); // Şifreyi çıkart
        if (!user) return res.status(401).json({ message: 'User not found.' });

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token.', error: err.message });
    }
};

// Admin kontrolü
exports.verifyAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'User not authenticated.' });
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
};
