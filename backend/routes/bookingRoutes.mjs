import express from 'express';
import Booking from '../models/Booking.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().limit(100).populate('user tour');
    return res.apiSuccess(bookings, 'Bookings retrieved');
  } catch (err) {
    return res.apiError(err.message);
  }
});

export default router;
