// AI Route - Backend
const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../controllers/aiController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Admin veya yetkili kullanıcılar AI endpointlerini kullanabilir
router.post('/query', verifyToken, verifyAdmin, getAIResponse);

module.exports = router;
