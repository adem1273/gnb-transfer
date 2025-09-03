const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token doğrulama
exports.verifyToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) return res.status(401).json({ message: 'Invalid token.' });
        next();
    } catch (err) {
        res.status(401).json({ message: 'Failed to authenticate token.' });
    }
};

// Admin doğrulama
exports.verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
};
