const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Kullanıcı kayıt ve giriş rotaları
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Kullanıcı profili rotası (token ile korunur)
router.get('/profile', verifyToken, userController.getProfile);

// Admin yetkisi gerektiren rotalar
router.get('/', verifyToken, verifyAdmin, userController.getAllUsers);
router.delete('/:id', verifyToken, verifyAdmin, userController.deleteUser);

module.exports = router;
