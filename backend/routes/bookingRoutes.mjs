/**
 * Booking routes - comprehensive booking management
 */

import express from 'express';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import {
  validateBookingCreation,
  validateBookingStatusUpdate,
  validateMongoId,
} from '../validators/index.mjs';

const router = express.Router();

/**
 * POST /api/bookings - Create a new booking
 */
router.post('/', strictRateLimiter, validateBookingCreation, async (req, res) => {
  try {
    const { name, email, tourId, paymentMethod, guests, date } = req.body;
    
    // Validate required fields
    if (!name || !email || !tourId) {
      return res.apiError('Name, email, and tourId are required', 400);
    }
    
    // Verify tour exists
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.apiError('Tour not found', 404);
    }
    
    // Determine status based on payment method
    const status = paymentMethod === 'cash' ? 'pending' : 'confirmed';
    
    // Create booking
    const booking = await Booking.create({
      name,
      email,
      tourId,
      tour: tourId,
      paymentMethod: paymentMethod || 'cash',
      status,
      guests: guests || 1,
      date: date || new Date(),
      amount: tour.price * (guests || 1)
    });
    
    return res.apiSuccess(booking, 'Booking created successfully', 201);
  } catch (error) {
    return res.apiError('Failed to create booking: ' + error.message, 500);
  }
});

/**
 * GET /api/bookings - Get all bookings (Admin only)
 */
router.get('/', requireAuth(['admin']), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('tour', 'title price duration')
      .populate('tourId', 'title price duration')
      .sort({ createdAt: -1 })
      .limit(200);
    
    return res.apiSuccess(bookings, 'Bookings retrieved successfully');
  } catch (error) {
    return res.apiError('Failed to retrieve bookings: ' + error.message, 500);
  }
});

/**
 * GET /api/bookings/:id - Get booking by ID (Admin only)
 */
router.get('/:id', requireAuth(['admin']), validateMongoId, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tour', 'title price duration')
      .populate('tourId', 'title price duration');
    
    if (!booking) {
      return res.apiError('Booking not found', 404);
    }
    
    return res.apiSuccess(booking, 'Booking retrieved successfully');
  } catch (error) {
    return res.apiError('Failed to fetch booking: ' + error.message, 500);
  }
});

/**
 * DELETE /api/bookings/:id - Delete a booking (Admin only)
 */
router.delete('/:id', requireAuth(['admin']), validateMongoId, strictRateLimiter, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.apiError('Booking not found', 404);
    }
    
    return res.apiSuccess(null, 'Booking deleted successfully');
  } catch (error) {
    return res.apiError('Failed to delete booking: ' + error.message, 500);
  }
});

/**
 * PUT /api/bookings/:id/status - Update booking status (Admin only)
 */
router.put(
  '/:id/status',
  requireAuth(['admin']),
  validateMongoId,
  validateBookingStatusUpdate,
  strictRateLimiter,
  async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.apiError('Status is required', 400);
    }
    
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.apiError(`Status must be one of: ${validStatuses.join(', ')}`, 400);
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('tour', 'title price');
    
    if (!booking) {
      return res.apiError('Booking not found', 404);
    }
    
    return res.apiSuccess(booking, 'Booking status updated successfully');
  } catch (error) {
    return res.apiError('Failed to update booking status: ' + error.message, 500);
  }
});

export default router;

