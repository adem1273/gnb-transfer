const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllTours,
  getAllBookings,
  deleteTour,
  deleteUser,
  deleteBooking
} = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Admin yetkisi ile korunan endpointler
router.get('/users', verifyToken, verifyAdmin, getAllUsers);
router.get('/tours', verifyToken, verifyAdmin, getAllTours);
router.get('/bookings', verifyToken, verifyAdmin, getAllBookings);

router.delete('/tours/:id', verifyToken, verifyAdmin, deleteTour);
router.delete('/users/:id', verifyToken, verifyAdmin, deleteUser);
router.delete('/bookings/:id', verifyToken, verifyAdmin, deleteBooking);

module.exports = router;
