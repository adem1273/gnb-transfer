/**
 * PayTR Payment Routes
 *
 * @module routes/paytrRoutes
 * @description API endpoints for PayTR payment gateway integration
 *
 * Endpoints:
 * - POST /api/payments/paytr/create - Create payment token
 * - POST /api/payments/paytr/callback - IPN callback (webhook)
 * - GET /api/payments/paytr/success - Payment success redirect
 * - GET /api/payments/paytr/fail - Payment failure redirect
 * - GET /api/payments/paytr/status/:bookingId - Get payment status
 *
 * Security:
 * - HMAC hash verification for callbacks
 * - Rate limiting on create endpoint
 * - Input validation
 */

import express from 'express';
import { z } from 'zod';
import Booking from '../models/Booking.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import { sanitizeRequest } from '../middlewares/sanitize.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import {
  isPaytrConfigured,
  createPayment,
  processPaymentCallback,
  handlePaymentSuccess,
  handlePaymentFailure,
  getPaymentStatus,
} from '../services/paytrService.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeRequest);

/**
 * Validation schemas
 */
const createPaymentSchema = z.object({
  bookingId: z.string().length(24, 'Invalid booking ID'),
  successUrl: z.string().url('Invalid success URL'),
  failUrl: z.string().url('Invalid failure URL'),
  maxInstallment: z.number().int().min(0).max(12).optional().default(0),
});

/**
 * @route   GET /api/payments/paytr/config
 * @desc    Check if PayTR is configured
 * @access  Public
 */
router.get('/config', (req, res) => {
  return res.apiSuccess({
    configured: isPaytrConfigured(),
    testMode: process.env.PAYTR_TEST_MODE === 'true',
  });
});

/**
 * @route   POST /api/payments/paytr/create
 * @desc    Create PayTR payment token for a booking
 * @access  Public (rate limited)
 * @body    {string} bookingId - MongoDB ObjectId of the booking
 * @body    {string} successUrl - URL to redirect on success
 * @body    {string} failUrl - URL to redirect on failure
 * @body    {number} [maxInstallment=0] - Maximum installment count
 * @returns {object} - Payment token and iframe URL
 */
router.post('/create', strictRateLimiter, async (req, res) => {
  try {
    // Validate request body
    const validation = createPaymentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.apiError(
        `Validation failed: ${validation.error.errors.map((e) => e.message).join(', ')}`,
        400
      );
    }

    const { bookingId, successUrl, failUrl, maxInstallment } = validation.data;

    // Check if PayTR is configured
    if (!isPaytrConfigured()) {
      return res.apiError('PayTR payment gateway is not available', 503);
    }

    // Fetch booking details
    const booking = await Booking.findById(bookingId)
      .populate('tour', 'title')
      .lean();

    if (!booking) {
      return res.apiError('Booking not found', 404);
    }

    // Check if booking is already paid
    if (booking.status === 'paid') {
      return res.apiError('This booking has already been paid', 400);
    }

    // Get client IP
    const userIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    // Create payment
    const result = await createPayment({
      bookingId,
      email: booking.email,
      amount: booking.amount,
      userName: booking.name,
      userPhone: booking.phone || '',
      userIp,
      tourName: booking.tour?.title || 'Transfer Service',
      extraServicesTotal: booking.extraServicesTotal || 0,
      successUrl,
      failUrl,
      maxInstallment,
      currency: 'TL',
    });

    if (!result.success) {
      return res.apiError(result.error, 400);
    }

    // Update booking with payment reference
    await Booking.findByIdAndUpdate(bookingId, {
      paymentMethod: 'paytr',
      $set: {
        'paymentDetails.merchantOid': result.merchantOid,
        'paymentDetails.paytrToken': result.token,
        'paymentDetails.initiatedAt': new Date(),
      },
    });

    return res.apiSuccess({
      token: result.token,
      merchantOid: result.merchantOid,
      iframeUrl: result.iframeUrl,
    }, 'Payment token created successfully');
  } catch (error) {
    logger.error('PayTR create payment error', { error: error.message });
    return res.apiError('Failed to create payment', 500);
  }
});

/**
 * @route   POST /api/payments/paytr/callback
 * @desc    PayTR IPN (Instant Payment Notification) webhook
 * @access  Public (verified by hash)
 *
 * This endpoint is called by PayTR servers when payment status changes.
 * Must return 'OK' to acknowledge receipt.
 */
router.post('/callback', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    logger.info('PayTR IPN callback received', {
      merchantOid: req.body.merchant_oid,
      status: req.body.status,
    });

    const result = await processPaymentCallback(req.body);

    if (!result.acknowledge) {
      // Don't acknowledge - PayTR will retry
      logger.warn('PayTR callback not acknowledged', { error: result.error });
      return res.status(400).send('FAIL');
    }

    if (result.success && result.data) {
      // Update booking status based on payment result
      const updateData = {
        status: result.data.paymentStatus === 'paid' ? 'paid' : 'pending',
        $set: {
          'paymentDetails.completedAt': new Date(),
          'paymentDetails.paymentType': result.data.paymentType,
          'paymentDetails.isTestMode': result.data.isTestMode,
        },
      };

      if (result.data.failureReason) {
        updateData.$set['paymentDetails.failureReason'] = result.data.failureReason;
      }

      await Booking.findByIdAndUpdate(result.data.bookingId, updateData);

      logger.info('Booking updated after PayTR callback', {
        bookingId: result.data.bookingId,
        newStatus: result.data.paymentStatus,
      });
    }

    // Must return 'OK' to PayTR
    return res.status(200).send('OK');
  } catch (error) {
    logger.error('PayTR callback error', { error: error.message });
    // Still return OK to prevent infinite retries
    return res.status(200).send('OK');
  }
});

/**
 * @route   GET /api/payments/paytr/success
 * @desc    Payment success redirect handler
 * @access  Public
 *
 * User is redirected here after successful payment.
 * Note: Actual payment confirmation comes via IPN callback.
 */
router.get('/success', (req, res) => {
  const result = handlePaymentSuccess(req.query);

  // In production, redirect to frontend success page
  if (process.env.FRONTEND_URL) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/success?bookingId=${result.bookingId}&merchantOid=${result.merchantOid}`
    );
  }

  return res.apiSuccess(result, 'Payment completed');
});

/**
 * @route   GET /api/payments/paytr/fail
 * @desc    Payment failure redirect handler
 * @access  Public
 *
 * User is redirected here after failed payment.
 */
router.get('/fail', (req, res) => {
  const result = handlePaymentFailure(req.query);

  // In production, redirect to frontend failure page
  if (process.env.FRONTEND_URL) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/failed?bookingId=${result.bookingId}&merchantOid=${result.merchantOid}`
    );
  }

  return res.apiError(result.message, 400);
});

/**
 * @route   GET /api/payments/paytr/status/:bookingId
 * @desc    Get payment status for a booking
 * @access  Private (requires authentication)
 */
router.get('/status/:bookingId', requireAuth(), async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Validate booking ID format
    if (!/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      return res.apiError('Invalid booking ID format', 400);
    }

    const result = await getPaymentStatus(bookingId, Booking);

    if (!result.success) {
      return res.apiError(result.error, 404);
    }

    return res.apiSuccess(result.data, 'Payment status retrieved');
  } catch (error) {
    logger.error('PayTR status check error', { error: error.message });
    return res.apiError('Failed to get payment status', 500);
  }
});

export default router;
