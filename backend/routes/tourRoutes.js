const express = require('express');
const router = express.Router();
const {
  createTour,
  getAllTours,
  getTourById,
  updateTour,
  deleteTour,
  getCampaignTours,
  getDiscountedPriceForTour,
  getMostPopularTours // Yeni import
} = require('../controllers/tourController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Turlar
router.get('/', getAllTours);
router.get('/campaigns', getCampaignTours);
router.get('/most-popular', getMostPopularTours); // Yeni rota
router.get('/:id', getTourById);
router.get('/:id/discounted-price', getDiscountedPriceForTour);

// Admin yetkisi gereken işlemler
router.post('/', verifyToken, verifyAdmin, createTour);
router.put('/:id', verifyToken, verifyAdmin, updateTour);
router.delete('/:id', verifyToken, verifyAdmin, deleteTour);

module.exports = router;