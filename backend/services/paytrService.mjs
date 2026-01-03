/**
 * PayTR Payment Service
 *
 * @module services/paytrService
 * @description Handles PayTR payment gateway integration for Turkish market
 *
 * PayTR is a popular Turkish payment gateway that supports:
 * - Credit/Debit card payments
 * - Bank transfers
 * - Installment payments
 *
 * Security:
 * - HMAC SHA256 hash verification for all requests
 * - IPN (Instant Payment Notification) verification
 * - Test mode support for development
 *
 * @see https://dev.paytr.com/ - PayTR Developer Documentation
 */

import crypto from 'crypto';
import logger from '../config/logger.mjs';

// PayTR Configuration from environment variables
const getPaytrConfig = () => ({
  merchantId: process.env.PAYTR_MERCHANT_ID || '',
  merchantKey: process.env.PAYTR_MERCHANT_KEY || '',
  merchantSalt: process.env.PAYTR_MERCHANT_SALT || '',
  testMode: process.env.PAYTR_TEST_MODE === 'true',
  // PayTR uses the same API URL for both test and production modes.
  // The test_mode parameter in the request differentiates test vs production transactions.
  apiUrl: 'https://www.paytr.com/odeme/api/get-token',
});

/**
 * Check if PayTR is configured
 * @returns {boolean} True if all required config values are present
 */
export const isPaytrConfigured = () => {
  const config = getPaytrConfig();
  return !!(config.merchantId && config.merchantKey && config.merchantSalt);
};

/**
 * Generate PayTR hash for payment token request
 *
 * PayTR uses HMAC SHA256 for request verification.
 * The hash is calculated from a concatenation of request parameters.
 *
 * @param {Object} params - Payment parameters
 * @param {string} params.merchantOid - Unique order ID
 * @param {string} params.email - Customer email
 * @param {number} params.paymentAmount - Amount in kuruş (smallest currency unit)
 * @param {string} params.userBasket - Base64 encoded JSON basket data
 * @param {number} params.noInstallment - 0 or 1 (disable installment)
 * @param {number} params.maxInstallment - Maximum installment count (0-12)
 * @param {string} params.currency - Currency code (TL, USD, EUR, GBP)
 * @param {number} params.testMode - 1 for test, 0 for production
 * @param {string} params.userIp - Customer IP address
 * @returns {string} Base64 encoded HMAC SHA256 hash
 */
export const generatePaytrHash = (params) => {
  const config = getPaytrConfig();

  // PayTR hash string format (order matters!)
  const hashStr = [
    config.merchantId,
    params.userIp,
    params.merchantOid,
    params.email,
    params.paymentAmount,
    params.userBasket,
    params.noInstallment,
    params.maxInstallment,
    params.currency,
    params.testMode,
  ].join('');

  // Create HMAC with merchant key and salt
  const hashInput = hashStr + config.merchantSalt;
  const hash = crypto
    .createHmac('sha256', config.merchantKey)
    .update(hashInput)
    .digest('base64');

  return hash;
};

/**
 * Generate PayTR IPN (callback) verification hash
 *
 * @param {Object} params - IPN callback parameters
 * @param {string} params.merchantOid - Order ID from callback
 * @param {string} params.status - Payment status (success/failed)
 * @param {string} params.totalAmount - Total amount charged
 * @returns {string} Hash for verification
 */
export const generateIpnHash = (params) => {
  const config = getPaytrConfig();

  // IPN hash format
  const hashStr = [
    params.merchantOid,
    config.merchantSalt,
    params.status,
    params.totalAmount,
  ].join('');

  const hash = crypto
    .createHmac('sha256', config.merchantKey)
    .update(hashStr)
    .digest('base64');

  return hash;
};

/**
 * Verify IPN callback hash
 *
 * @param {Object} callbackData - Data received from PayTR IPN
 * @returns {boolean} True if hash is valid
 */
export const verifyIpnHash = (callbackData) => {
  const { merchant_oid, status, total_amount, hash } = callbackData;

  const expectedHash = generateIpnHash({
    merchantOid: merchant_oid,
    status,
    totalAmount: total_amount,
  });

  // Use timing-safe comparison to prevent timing attacks
  try {
    const hashBuffer = Buffer.from(hash, 'base64');
    const expectedBuffer = Buffer.from(expectedHash, 'base64');

    if (hashBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, expectedBuffer);
  } catch {
    return false;
  }
};

/**
 * Create basket data for PayTR
 * Note: Basket amounts should be in kuruş (smallest currency unit)
 *
 * @param {Object} booking - Booking object with details
 * @param {string} [booking.tourName] - Name of the tour/service
 * @param {number} [booking.amount] - Amount in main currency (will be converted to kuruş)
 * @param {number} [booking.extraServicesTotal] - Extra services total in main currency
 * @returns {string} Base64 encoded JSON basket
 */
export const createBasketData = (booking) => {
  // Convert main currency amounts to kuruş (multiply by 100)
  const basketItems = [
    [
      booking.tourName || 'Transfer Service',
      String(Math.round((booking.amount || 0) * 100)), // Convert to kuruş
      '1', // quantity
    ],
  ];

  // Add extra services if any
  if (booking.extraServicesTotal > 0) {
    basketItems.push([
      'Extra Services',
      String(Math.round(booking.extraServicesTotal * 100)), // Convert to kuruş
      '1',
    ]);
  }

  return Buffer.from(JSON.stringify(basketItems)).toString('base64');
};

/**
 * Create PayTR payment token request
 *
 * This initiates a payment by requesting an iframe token from PayTR.
 *
 * @param {Object} options - Payment options
 * @param {string} options.bookingId - Internal booking ID
 * @param {string} options.email - Customer email
 * @param {number} options.amount - Amount in main currency unit (TRY). Will be converted to kuruş (x100).
 * @param {string} options.userName - Customer name
 * @param {string} options.userPhone - Customer phone
 * @param {string} options.userIp - Customer IP address
 * @param {string} options.userAddress - Customer address
 * @param {string} [options.currency='TL'] - Currency code (TL, USD, EUR, GBP)
 * @param {string} options.tourName - Name of the tour/service
 * @param {number} [options.extraServicesTotal=0] - Extra services total in main currency unit
 * @param {string} options.successUrl - URL to redirect on success
 * @param {string} options.failUrl - URL to redirect on failure
 * @param {number} [options.maxInstallment=0] - Maximum installment (0 = no installment)
 * @returns {Promise<Object>} PayTR response with token or error
 */
export const createPayment = async (options) => {
  const config = getPaytrConfig();

  if (!isPaytrConfigured()) {
    logger.error('PayTR is not configured');
    return {
      success: false,
      error: 'PayTR payment gateway is not configured',
    };
  }

  try {
    // Generate unique merchant order ID
    const merchantOid = `GNB-${options.bookingId}-${Date.now()}`;

    // Amount must be in kuruş (multiply by 100 for TRY)
    // If amount is already in smallest unit, use as is
    const paymentAmount = Math.round(options.amount * 100);

    // Create basket data
    const userBasket = createBasketData({
      tourName: options.tourName,
      amount: options.amount,
      extraServicesTotal: options.extraServicesTotal || 0,
    });

    const testMode = config.testMode ? '1' : '0';
    const noInstallment = options.maxInstallment === 0 ? '1' : '0';
    const maxInstallment = String(options.maxInstallment || 0);
    const currency = options.currency || 'TL';

    // Generate hash
    const paytrToken = generatePaytrHash({
      merchantOid,
      email: options.email,
      paymentAmount: String(paymentAmount),
      userBasket,
      noInstallment,
      maxInstallment,
      currency,
      testMode,
      userIp: options.userIp,
    });

    // Prepare form data for PayTR API
    const formData = new URLSearchParams();
    formData.append('merchant_id', config.merchantId);
    formData.append('user_ip', options.userIp);
    formData.append('merchant_oid', merchantOid);
    formData.append('email', options.email);
    formData.append('payment_amount', String(paymentAmount));
    formData.append('paytr_token', paytrToken);
    formData.append('user_basket', userBasket);
    formData.append('debug_on', config.testMode ? '1' : '0');
    formData.append('no_installment', noInstallment);
    formData.append('max_installment', maxInstallment);
    formData.append('user_name', options.userName);
    formData.append('user_address', options.userAddress || 'Not provided');
    formData.append('user_phone', options.userPhone || '');
    formData.append('merchant_ok_url', options.successUrl);
    formData.append('merchant_fail_url', options.failUrl);
    formData.append('timeout_limit', '30');
    formData.append('currency', currency);
    formData.append('test_mode', testMode);
    formData.append('lang', 'tr'); // Turkish language

    // Make API request to get iframe token
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (result.status === 'success') {
      logger.info('PayTR payment token created successfully', {
        merchantOid,
        bookingId: options.bookingId,
      });

      return {
        success: true,
        token: result.token,
        merchantOid,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
      };
    }

    logger.error('PayTR token creation failed', {
      reason: result.reason,
      merchantOid,
    });

    return {
      success: false,
      error: result.reason || 'Failed to create payment token',
    };
  } catch (error) {
    logger.error('PayTR createPayment error', {
      error: error.message,
      bookingId: options.bookingId,
    });

    return {
      success: false,
      error: 'Payment service temporarily unavailable',
    };
  }
};

/**
 * Process PayTR IPN (Instant Payment Notification) callback
 *
 * This is called by PayTR when a payment status changes.
 * Must return 'OK' to acknowledge receipt.
 *
 * @param {Object} callbackData - Data from PayTR POST request
 * @param {string} callbackData.merchant_oid - Order ID
 * @param {string} callbackData.status - 'success' or 'failed'
 * @param {string} callbackData.total_amount - Total amount in kuruş
 * @param {string} callbackData.hash - Verification hash
 * @param {string} [callbackData.failed_reason_code] - Failure reason code
 * @param {string} [callbackData.failed_reason_msg] - Failure reason message
 * @param {string} [callbackData.test_mode] - '1' if test transaction
 * @param {string} [callbackData.payment_type] - Payment type (card, etc.)
 * @returns {Object} Processing result
 */
export const processPaymentCallback = async (callbackData) => {
  try {
    // Verify hash first
    if (!verifyIpnHash(callbackData)) {
      logger.warn('PayTR IPN hash verification failed', {
        merchantOid: callbackData.merchant_oid,
      });

      return {
        success: false,
        error: 'Invalid hash - unauthorized callback',
        acknowledge: false,
      };
    }

    const {
      merchant_oid,
      status,
      total_amount,
      failed_reason_code,
      failed_reason_msg,
      test_mode,
      payment_type,
    } = callbackData;

    // Extract booking ID from merchant_oid (format: GNB-{bookingId}-{timestamp})
    const bookingIdMatch = merchant_oid.match(/^GNB-(.+)-\d+$/);
    const bookingId = bookingIdMatch ? bookingIdMatch[1] : null;

    if (!bookingId) {
      logger.error('Could not extract booking ID from merchant_oid', {
        merchantOid: merchant_oid,
      });

      return {
        success: false,
        error: 'Invalid order ID format',
        acknowledge: true, // Still acknowledge to prevent retries
      };
    }

    const isSuccess = status === 'success';

    logger.info('PayTR IPN processed', {
      merchantOid: merchant_oid,
      bookingId,
      status,
      totalAmount: total_amount,
      paymentType: payment_type,
      testMode: test_mode === '1',
    });

    return {
      success: true,
      acknowledge: true, // Return 'OK' to PayTR
      data: {
        bookingId,
        merchantOid: merchant_oid,
        paymentStatus: isSuccess ? 'paid' : 'failed',
        amount: parseInt(total_amount, 10) / 100, // Convert kuruş to TRY
        isTestMode: test_mode === '1',
        paymentType: payment_type,
        failureReason: isSuccess
          ? null
          : {
              code: failed_reason_code,
              message: failed_reason_msg,
            },
      },
    };
  } catch (error) {
    logger.error('PayTR callback processing error', {
      error: error.message,
    });

    return {
      success: false,
      error: 'Callback processing failed',
      acknowledge: true, // Acknowledge to prevent infinite retries
    };
  }
};

/**
 * Handle payment success redirect
 *
 * Called when customer is redirected back after successful payment.
 * Note: This is a redirect, not IPN - actual payment confirmation comes via IPN.
 *
 * @param {Object} params - Query/body params from redirect
 * @param {string} params.merchant_oid - Order ID
 * @returns {Object} Success handling result
 */
export const handlePaymentSuccess = (params) => {
  const { merchant_oid } = params;

  // Extract booking ID
  const bookingIdMatch = merchant_oid?.match(/^GNB-(.+)-\d+$/);
  const bookingId = bookingIdMatch ? bookingIdMatch[1] : null;

  logger.info('PayTR payment success redirect', {
    merchantOid: merchant_oid,
    bookingId,
  });

  return {
    success: true,
    bookingId,
    merchantOid: merchant_oid,
    message: 'Payment completed successfully. Please wait for confirmation.',
  };
};

/**
 * Handle payment failure redirect
 *
 * Called when customer is redirected back after failed payment.
 *
 * @param {Object} params - Query/body params from redirect
 * @param {string} params.merchant_oid - Order ID
 * @returns {Object} Failure handling result
 */
export const handlePaymentFailure = (params) => {
  const { merchant_oid } = params;

  // Extract booking ID
  const bookingIdMatch = merchant_oid?.match(/^GNB-(.+)-\d+$/);
  const bookingId = bookingIdMatch ? bookingIdMatch[1] : null;

  logger.info('PayTR payment failure redirect', {
    merchantOid: merchant_oid,
    bookingId,
  });

  return {
    success: false,
    bookingId,
    merchantOid: merchant_oid,
    message: 'Payment was not completed. Please try again.',
  };
};

/**
 * Get payment status from internal tracking
 *
 * Note: PayTR does not have a direct API to check payment status.
 * Status must be tracked internally via IPN callbacks.
 *
 * @param {string} bookingId - Booking ID to check
 * @param {Object} Booking - Mongoose Booking model
 * @returns {Promise<Object>} Payment status
 */
export const getPaymentStatus = async (bookingId, Booking) => {
  try {
    const booking = await Booking.findById(bookingId).select('status paymentMethod amount').lean();

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    // Map booking status to payment status
    const paymentStatusMap = {
      paid: 'completed',
      confirmed: 'pending',
      pending: 'pending',
      cancelled: 'cancelled',
      completed: 'completed',
    };

    return {
      success: true,
      data: {
        bookingId,
        paymentMethod: booking.paymentMethod,
        paymentStatus: paymentStatusMap[booking.status] || 'unknown',
        bookingStatus: booking.status,
        amount: booking.amount,
      },
    };
  } catch (error) {
    logger.error('Error getting payment status', {
      error: error.message,
      bookingId,
    });

    return {
      success: false,
      error: 'Failed to get payment status',
    };
  }
};

/**
 * PayTR Error Codes Reference
 * Common error codes returned by PayTR
 */
export const PAYTR_ERROR_CODES = {
  '1': 'Transaction declined by bank',
  '2': 'Card number invalid',
  '3': 'Card expired',
  '4': 'Insufficient funds',
  '5': 'CVV error',
  '6': '3D Secure authentication failed',
  '7': 'Transaction limit exceeded',
  '8': 'Card blocked',
  '9': 'General error',
  '10': 'Timeout',
  '11': 'Connection error',
  '12': 'Hash error',
};

/**
 * PayTR Test Cards for Development
 * Use these cards when PAYTR_TEST_MODE=true
 */
export const PAYTR_TEST_CARDS = {
  success: {
    number: '4355084355084358',
    expiry: '12/30',
    cvv: '000',
    description: 'Successful payment test card',
  },
  fail: {
    number: '4090700090700006',
    expiry: '12/30',
    cvv: '000',
    description: 'Failed payment test card',
  },
  threeDSecure: {
    number: '5571135571135575',
    expiry: '12/30',
    cvv: '000',
    description: '3D Secure authentication test card',
  },
};

export default {
  isPaytrConfigured,
  generatePaytrHash,
  generateIpnHash,
  verifyIpnHash,
  createBasketData,
  createPayment,
  processPaymentCallback,
  handlePaymentSuccess,
  handlePaymentFailure,
  getPaymentStatus,
  PAYTR_ERROR_CODES,
  PAYTR_TEST_CARDS,
};
