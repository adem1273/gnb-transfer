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
  getMostPopularTours
} = require('../controllers/tourController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Turlar
router.get('/', getAllTours);
router.get('/campaigns', getCampaignTours);
router.get('/most-popular', getMostPopularTours);
router.get('/:id', getTourById);
router.get('/:id/discounted-price', getDiscountedPriceForTour);

// Admin işlemleri
router.post('/', verifyToken, verifyAdmin, createTour);
router.put('/:id', verifyToken, verifyAdmin, updateTour);
router.delete('/:id', verifyToken, verifyAdmin, deleteTour);

module.exports = router;
