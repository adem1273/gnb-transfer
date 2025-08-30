const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  deleteBooking
} = require('../controllers/bookingController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Booking işlemleri
router.post('/', createBooking);
router.get('/', verifyToken, verifyAdmin, getAllBookings);
router.get('/:id', verifyToken, verifyAdmin, getBookingById);
router.delete('/:id', verifyToken, verifyAdmin, deleteBooking);

module.exports = router;
