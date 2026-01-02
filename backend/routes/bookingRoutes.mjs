/**
 * Booking routes - comprehensive booking management
 *
 * @module routes/bookingRoutes
 * @description Handles all booking-related operations including creation, retrieval, and management
 *
 * Security features:
 * - NoSQL injection protection via sanitization
 * - Zod schema validation for type safety
 * - Rate limiting on creation endpoint
 * - Authentication required for sensitive operations
 */

import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import { cacheMiddleware, clearCache } from '../middlewares/cache.mjs';
import { cacheResponse, clearCacheByTags } from '../middlewares/cacheMiddleware.mjs';
import { sanitizeRequest } from '../middlewares/sanitize.mjs';
import {
  createBookingSchema,
  updateBookingSchema,
  bookingQuerySchema,
  validateZod,
  validateObjectId,
} from '../validators/bookingValidator.mjs';
import {
  validateBookingCreation,
  validateBookingStatusUpdate,
  validateMongoId,
} from '../validators/index.mjs';
import { VALID_STATUSES } from '../constants/bookingStatus.mjs';

const router = express.Router();

// Apply sanitization to all booking routes
router.use(sanitizeRequest);

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
 * Security:
 * - Rate limited to 5 requests per 15 minutes to prevent spam
 * - Input sanitized to prevent NoSQL injection
 * - Validated with Zod schema for type safety
 * - Tour existence verified before booking creation
 */
router.post('/', strictRateLimiter, validateZod(createBookingSchema, 'body'), async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      phoneCountryCode,
      tourId, 
      paymentMethod, 
      guests, 
      adultsCount,
      childrenCount,
      infantsCount,
      passengers,
      flightNumber,
      extraServices,
      date, 
      time,
      pickupLocation, 
      notes 
    } = req.body;

    // Note: Validation already done by Zod schema, including ObjectId validation

    // Verify tour exists (use lean for read-only)
    const tour = await Tour.findById(tourId).lean();
    if (!tour) {
      return res.apiError('Tour not found', 404);
    }

    // Determine status based on payment method
    const status = paymentMethod === 'cash' ? 'pending' : 'confirmed';

    // Calculate total guests
    const totalGuests = (adultsCount || 1) + (childrenCount || 0) + (infantsCount || 0);

    // Calculate extra services total
    let extraServicesTotal = 0;
    if (extraServices) {
      if (extraServices.childSeat?.selected) {
        extraServicesTotal += (extraServices.childSeat.quantity || 0) * (extraServices.childSeat.price || 10);
      }
      if (extraServices.babySeat?.selected) {
        extraServicesTotal += (extraServices.babySeat.quantity || 0) * (extraServices.babySeat.price || 10);
      }
      if (extraServices.meetAndGreet?.selected) {
        extraServicesTotal += extraServices.meetAndGreet.price || 15;
      }
      if (extraServices.vipLounge?.selected) {
        extraServicesTotal += extraServices.vipLounge.price || 50;
      }
    }

    // Calculate total amount
    const baseAmount = tour.price * totalGuests;
    const totalAmount = baseAmount + extraServicesTotal;

    // Create booking
    // Note: Both 'tour' (required by model) and 'tourId' (used for backward compatibility)
    // reference the same tour. This dual-field approach allows gradual migration while
    // maintaining compatibility with existing code that may use either field.
    const booking = await Booking.create({
      name,
      email,
      phone,
      phoneCountryCode: phoneCountryCode || '+90',
      tour: tourId,
      tourId,
      paymentMethod: paymentMethod || 'cash',
      status,
      guests: guests || totalGuests || 1,
      adultsCount: adultsCount || 1,
      childrenCount: childrenCount || 0,
      infantsCount: infantsCount || 0,
      passengers: passengers || [{ firstName: name.split(' ')[0] || name, lastName: name.split(' ').slice(1).join(' ') || '-', type: 'adult' }],
      flightNumber,
      extraServices,
      extraServicesTotal,
      date: date || new Date(),
      time,
      amount: totalAmount,
      pickupLocation,
      notes,
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
 * @desc    Get all bookings with tour details - Cached 5 minutes per user
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
/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with tour details - Cached 5 minutes per user
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @query   {number} [page=1] - Page number for pagination
 * @query   {number} [limit=50] - Results per page (max 200)
 * @query   {string} [status] - Filter by booking status
 * @returns {object} - Paginated bookings with tour details
 *
 * Features:
 * - Populates tour details (title, price, duration)
 * - Sorted by creation date (newest first)
 * - Supports pagination and status filtering
 * - Cached for 5 minutes (admin data changes frequently)
 */
router.get('/', requireAuth(['admin']), cacheResponse(300, { tags: ['bookings', 'bookings:list'], varyByUser: true }), async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // Use lean() for read-only query and select only needed fields
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('tour', 'title price duration')
        .populate('user', 'name email')
        .select('-__v') // Exclude internal version field; tourId redundant with populated tour
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter)
    ]);

    return res.apiSuccess({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Bookings retrieved successfully');
  } catch (error) {
    return res.apiError(`Failed to retrieve bookings: ${error.message}`, 500);
  }
});

/**
 * @route   GET /api/bookings/calendar
 * @desc    Get bookings formatted for calendar view
 * @access  Private (admin, manager)
 * @query   {string} [startDate] - Start date filter (ISO 8601)
 * @query   {string} [endDate] - End date filter (ISO 8601)
 * @returns {array} - Array of bookings with calendar-friendly format
 *
 * Response format:
 * - Each booking includes: id, title, start, end, status, color
 * - Color-coded by status: confirmed (green), pending (yellow), cancelled (red)
 *
 * Note: This route must be defined before /:id to avoid wildcard matching
 */
router.get('/calendar', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter - use 'date' field as defined in Booking model
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Use lean() for read-only query and select only needed fields
    const bookings = await Booking.find(filter)
      .populate('tour', 'title')
      .select('name date time status tour')
      .sort({ date: 1 })
      .lean();

    // Format for calendar
    const calendarEvents = bookings.map((booking) => {
      let color = '#gray';
      switch (booking.status) {
        case 'confirmed':
          color = '#10b981'; // green
          break;
        case 'pending':
          color = '#f59e0b'; // yellow
          break;
        case 'cancelled':
          color = '#ef4444'; // red
          break;
        default:
          color = '#6b7280'; // gray
      }

      return {
        id: booking._id,
        title: `${booking.name} - ${booking.tour?.title || booking.tour?.name || 'Tour'}`,
        start: booking.date || booking.createdAt,
        end: booking.date || booking.createdAt,
        status: booking.status,
        color,
        email: booking.email,
        guests: booking.guests,
        totalPrice: booking.amount,
      };
    });

    return res.apiSuccess(calendarEvents, 'Calendar events retrieved successfully');
  } catch (error) {
    return res.apiError(`Failed to fetch calendar events: ${error.message}`, 500);
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
router.get(
  '/:id',
  requireAuth(['admin']),
  validateMongoId,
  cacheMiddleware(300),
  async (req, res) => {
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
  }
);

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

      if (!VALID_STATUSES.includes(status)) {
        return res.apiError(`Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
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
