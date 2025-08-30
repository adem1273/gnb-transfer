const express = require('express');
const router = express.Router();
const { 
  getCustomerSegments, 
  getTourRecommendations,
  getAdminAssistantResponse,
  getMarketingSuggestions
} = require('../controllers/aiController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Tüm AI endpointleri admin yetkisi gerektirmeli
router.get('/segments', verifyToken, verifyAdmin, getCustomerSegments);
router.get('/recommendations', verifyToken, verifyAdmin, getTourRecommendations);
router.post('/admin-assistant', verifyToken, verifyAdmin, getAdminAssistantResponse);
router.get('/marketing-suggestions', verifyToken, verifyAdmin, getMarketingSuggestions);

module.exports = router;