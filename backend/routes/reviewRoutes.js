const express = require('express');
const router = express.Router();
const { getAllReviews, createReview, getFeaturedReviews } = require('../controllers/reviewController');

// Herkesin erişebileceği geri bildirim rotaları
router.get('/', getAllReviews);
router.get('/featured', getFeaturedReviews);
router.post('/', createReview);

module.exports = router;