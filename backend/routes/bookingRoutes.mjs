/**
 * Booking routes - comprehensive booking management
 *
 * @module routes/bookingRoutes
 * @description Handles all booking-related operations including creation, retrieval, and management
 */

import express from 'express';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import { cacheMiddleware, clearCache } from '../middlewares/cache.mjs';
import {
  validateBookingCreation,
  validateBookingStatusUpdate,
  validateMongoId,
} from '../validators/index.mjs';

const router = express.Router();

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking for a tour
 * @access  Public (rate limited)
 * @body    {string} name - Customer name (2-100 characters)
 * @body    {string} email - Customer email address
 * @body    {string} tourId - MongoDB ObjectId of the tour
 * @body    {string} [paymentMethod=cash] - Payment method (cash, card, stripe)
 * @body    {number} [guests=1] - Number of guests (1-50)
 * @body    {string} [date] - Booking date (ISO 8601 format)
 * @returns {object} - Created booking object with calculated amount
 *
 * Business logic:
 * - Validates tour existence before creating booking
 * - Calculates total amount as: tour.price * guests
 * - Sets status to 'pending' for cash, 'confirmed' for card/stripe
 * - Rate limited to 5 requests per 15 minutes to prevent spam
 */
router.post('/', strictRateLimiter, validateBookingCreation, async (req, res) => {
  try {
    const { name, email, tourId, paymentMethod, guests, date } = req.body;

    // Validate required fields
    if (!name || !email || !tourId) {
      return res.apiError('Name, email, and tourId are required', 400);
    }

    // Verify tour exists (use lean for read-only)
    const tour = await Tour.findById(tourId).lean();
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
      amount: tour.price * (guests || 1),
    });

    // Clear bookings cache when new booking is created
    clearCache(/^\/api\/bookings/);

    return res.apiSuccess(booking, 'Booking created successfully', 201);
  } catch (error) {
    return res.apiError(`Failed to create booking: ${error.message}`, 500);
  }
});

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with tour details
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @returns {array} - Array of booking objects with populated tour information
 *
 * Features:
 * - Populates tour details (title, price, duration)
 * - Sorted by creation date (newest first)
 * - Limited to 200 results to prevent performance issues
 * - Cached for 5 minutes (admin data changes frequently)
 */
router.get('/', requireAuth(['admin']), cacheMiddleware(300), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('tour', 'title price duration')
      .populate('tourId', 'title price duration')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.apiSuccess(bookings, 'Bookings retrieved successfully');
  } catch (error) {
    return res.apiError(`Failed to retrieve bookings: ${error.message}`, 500);
  }
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Get a specific booking by ID
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @param   {string} id - MongoDB ObjectId of the booking
 * @returns {object} - Booking object with populated tour details
 * - Cached for 5 minutes
 */
router.get('/:id', requireAuth(['admin']), validateMongoId, cacheMiddleware(300), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tour', 'title price duration')
      .populate('tourId', 'title price duration')
      .lean();

    if (!booking) {
      return res.apiError('Booking not found', 404);
    }

    return res.apiSuccess(booking, 'Booking retrieved successfully');
  } catch (error) {
    return res.apiError(`Failed to fetch booking: ${error.message}`, 500);
  }
});

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Delete a booking by ID
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @param   {string} id - MongoDB ObjectId of the booking to delete
 * @returns {null} - Success message on deletion
 *
 * Security:
 * - Requires admin role
 * - Rate limited to 5 requests per 15 minutes
 * - Validates MongoDB ObjectId format
 */
router.delete(
  '/:id',
  requireAuth(['admin']),
  validateMongoId,
  strictRateLimiter,
  async (req, res) => {
    try {
      const booking = await Booking.findByIdAndDelete(req.params.id);

      if (!booking) {
        return res.apiError('Booking not found', 404);
      }

      // Clear bookings cache
      clearCache(/^\/api\/bookings/);

      return res.apiSuccess(null, 'Booking deleted successfully');
    } catch (error) {
      return res.apiError(`Failed to delete booking: ${error.message}`, 500);
    }
  }
);

/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Update booking status
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @param   {string} id - MongoDB ObjectId of the booking
 * @body    {string} status - New status (pending, confirmed, cancelled, completed, paid)
 * @returns {object} - Updated booking object with tour details
 *
 * Security:
 * - Requires admin role
 * - Rate limited to 5 requests per 15 minutes
 * - Validates status against allowed values
 * - Validates MongoDB ObjectId format
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

      // Clear bookings cache
      clearCache(/^\/api\/bookings/);

      return res.apiSuccess(booking, 'Booking status updated successfully');
    } catch (error) {
      return res.apiError(`Failed to update booking status: ${error.message}`, 500);
    }
  }
);

export default router;
