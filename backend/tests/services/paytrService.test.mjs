/**
 * PayTR Service Unit Tests
 *
 * @description Tests for PayTR payment gateway service functions
 * Note: This test file doesn't require database connection as it tests pure functions
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Skip global setup (MongoDB) since this service doesn't need it
jest.setTimeout(10000);

// Mock the logger before importing the service
jest.unstable_mockModule('../../config/logger.mjs', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Set environment variables before import
process.env.PAYTR_MERCHANT_ID = 'test_merchant_id';
process.env.PAYTR_MERCHANT_KEY = 'test_merchant_key';
process.env.PAYTR_MERCHANT_SALT = 'test_merchant_salt';
process.env.PAYTR_TEST_MODE = 'true';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Import the service after setting env vars and mocking
const {
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
} = await import('../../services/paytrService.mjs');

describe('PayTR Service', () => {
  beforeEach(() => {
    // Reset environment variables for each test
    process.env.PAYTR_MERCHANT_ID = 'test_merchant_id';
    process.env.PAYTR_MERCHANT_KEY = 'test_merchant_key';
    process.env.PAYTR_MERCHANT_SALT = 'test_merchant_salt';
    process.env.PAYTR_TEST_MODE = 'true';
  });

  afterEach(() => {
    // Restore PayTR environment variables
    process.env.PAYTR_MERCHANT_ID = 'test_merchant_id';
    process.env.PAYTR_MERCHANT_KEY = 'test_merchant_key';
    process.env.PAYTR_MERCHANT_SALT = 'test_merchant_salt';
    process.env.PAYTR_TEST_MODE = 'true';
    jest.clearAllMocks();
  });

  describe('isPaytrConfigured', () => {
    it('should return true when all credentials are set', () => {
      expect(isPaytrConfigured()).toBe(true);
    });

    it('should return false when merchant ID is missing', () => {
      // Test by checking the function directly with empty string
      process.env.PAYTR_MERCHANT_ID = '';
      expect(isPaytrConfigured()).toBe(false);
    });

    it('should return false when merchant key is missing', () => {
      process.env.PAYTR_MERCHANT_KEY = '';
      expect(isPaytrConfigured()).toBe(false);
    });

    it('should return false when merchant salt is missing', () => {
      process.env.PAYTR_MERCHANT_SALT = '';
      expect(isPaytrConfigured()).toBe(false);
    });
  });

  describe('generatePaytrHash', () => {
    it('should generate a valid base64 hash', () => {
      const params = {
        merchantOid: 'GNB-123-456',
        email: 'test@example.com',
        paymentAmount: '10000',
        userBasket: Buffer.from(JSON.stringify([['Test', '100', '1']])).toString('base64'),
        noInstallment: '1',
        maxInstallment: '0',
        currency: 'TL',
        testMode: '1',
        userIp: '127.0.0.1',
      };

      const hash = generatePaytrHash(params);

      // Hash should be a non-empty base64 string
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      // Base64 pattern check
      expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should generate different hashes for different inputs', () => {
      const params1 = {
        merchantOid: 'GNB-123-456',
        email: 'test@example.com',
        paymentAmount: '10000',
        userBasket: Buffer.from('[]').toString('base64'),
        noInstallment: '1',
        maxInstallment: '0',
        currency: 'TL',
        testMode: '1',
        userIp: '127.0.0.1',
      };

      const params2 = {
        ...params1,
        paymentAmount: '20000', // Different amount
      };

      const hash1 = generatePaytrHash(params1);
      const hash2 = generatePaytrHash(params2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateIpnHash', () => {
    it('should generate a valid IPN verification hash', () => {
      const params = {
        merchantOid: 'GNB-123-456',
        status: 'success',
        totalAmount: '10000',
      };

      const hash = generateIpnHash(params);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe('verifyIpnHash', () => {
    it('should return true for valid hash', () => {
      const params = {
        merchantOid: 'GNB-123-456',
        status: 'success',
        totalAmount: '10000',
      };

      // Generate a valid hash
      const validHash = generateIpnHash(params);

      const callbackData = {
        merchant_oid: params.merchantOid,
        status: params.status,
        total_amount: params.totalAmount,
        hash: validHash,
      };

      expect(verifyIpnHash(callbackData)).toBe(true);
    });

    it('should return false for invalid hash', () => {
      const callbackData = {
        merchant_oid: 'GNB-123-456',
        status: 'success',
        total_amount: '10000',
        hash: 'invalid_hash_here',
      };

      expect(verifyIpnHash(callbackData)).toBe(false);
    });

    it('should return false for tampered data', () => {
      const originalParams = {
        merchantOid: 'GNB-123-456',
        status: 'success',
        totalAmount: '10000',
      };

      const validHash = generateIpnHash(originalParams);

      // Tamper with the data
      const tamperedData = {
        merchant_oid: 'GNB-123-456',
        status: 'failed', // Changed status
        total_amount: '10000',
        hash: validHash, // Hash from original data
      };

      expect(verifyIpnHash(tamperedData)).toBe(false);
    });
  });

  describe('createBasketData', () => {
    it('should create valid base64 encoded basket', () => {
      const booking = {
        tourName: 'Airport Transfer',
        amount: 150,
        extraServicesTotal: 0,
      };

      const basketData = createBasketData(booking);

      // Should be valid base64
      expect(basketData).toMatch(/^[A-Za-z0-9+/]+=*$/);

      // Decode and verify structure
      const decoded = JSON.parse(Buffer.from(basketData, 'base64').toString());
      expect(Array.isArray(decoded)).toBe(true);
      expect(decoded[0][0]).toBe('Airport Transfer');
    });

    it('should include extra services when present', () => {
      const booking = {
        tourName: 'Airport Transfer',
        amount: 150,
        extraServicesTotal: 25,
      };

      const basketData = createBasketData(booking);
      const decoded = JSON.parse(Buffer.from(basketData, 'base64').toString());

      expect(decoded.length).toBe(2);
      expect(decoded[1][0]).toBe('Extra Services');
      expect(decoded[1][1]).toBe('25');
    });

    it('should use default tour name when not provided', () => {
      const booking = {
        amount: 100,
        extraServicesTotal: 0,
      };

      const basketData = createBasketData(booking);
      const decoded = JSON.parse(Buffer.from(basketData, 'base64').toString());

      expect(decoded[0][0]).toBe('Transfer Service');
    });
  });

  describe('createPayment', () => {
    // Mock fetch for API calls
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return error when PayTR is not configured', async () => {
      process.env.PAYTR_MERCHANT_ID = '';

      const result = await createPayment({
        bookingId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        amount: 100,
        userName: 'Test User',
        userIp: '127.0.0.1',
        successUrl: 'https://example.com/success',
        failUrl: 'https://example.com/fail',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should make API request with correct parameters', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'success',
          token: 'test_token_123',
        }),
      });

      const options = {
        bookingId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        amount: 150,
        userName: 'Test User',
        userPhone: '+905551234567',
        userIp: '192.168.1.1',
        tourName: 'Airport Transfer',
        successUrl: 'https://example.com/success',
        failUrl: 'https://example.com/fail',
        maxInstallment: 3,
      };

      const result = await createPayment(options);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.token).toBe('test_token_123');
      expect(result.merchantOid).toContain('GNB-');
      expect(result.iframeUrl).toContain('test_token_123');
    });

    it('should handle API error response', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'failed',
          reason: 'Invalid merchant',
        }),
      });

      const result = await createPayment({
        bookingId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        amount: 100,
        userName: 'Test User',
        userIp: '127.0.0.1',
        successUrl: 'https://example.com/success',
        failUrl: 'https://example.com/fail',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid merchant');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await createPayment({
        bookingId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        amount: 100,
        userName: 'Test User',
        userIp: '127.0.0.1',
        successUrl: 'https://example.com/success',
        failUrl: 'https://example.com/fail',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('temporarily unavailable');
    });
  });

  describe('processPaymentCallback', () => {
    it('should reject callback with invalid hash', async () => {
      const callbackData = {
        merchant_oid: 'GNB-123-456',
        status: 'success',
        total_amount: '10000',
        hash: 'invalid_hash',
      };

      const result = await processPaymentCallback(callbackData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid hash');
      expect(result.acknowledge).toBe(false);
    });

    it('should process successful payment callback', async () => {
      const params = {
        merchantOid: 'GNB-507f1f77bcf86cd799439011-1704312000000',
        status: 'success',
        totalAmount: '15000',
      };

      const validHash = generateIpnHash(params);

      const callbackData = {
        merchant_oid: params.merchantOid,
        status: params.status,
        total_amount: params.totalAmount,
        hash: validHash,
        test_mode: '1',
        payment_type: 'card',
      };

      const result = await processPaymentCallback(callbackData);

      expect(result.success).toBe(true);
      expect(result.acknowledge).toBe(true);
      expect(result.data.bookingId).toBe('507f1f77bcf86cd799439011');
      expect(result.data.paymentStatus).toBe('paid');
      expect(result.data.amount).toBe(150); // 15000 kuruş = 150 TRY
      expect(result.data.isTestMode).toBe(true);
    });

    it('should process failed payment callback', async () => {
      const params = {
        merchantOid: 'GNB-507f1f77bcf86cd799439011-1704312000000',
        status: 'failed',
        totalAmount: '15000',
      };

      const validHash = generateIpnHash(params);

      const callbackData = {
        merchant_oid: params.merchantOid,
        status: params.status,
        total_amount: params.totalAmount,
        hash: validHash,
        failed_reason_code: '4',
        failed_reason_msg: 'Insufficient funds',
      };

      const result = await processPaymentCallback(callbackData);

      expect(result.success).toBe(true);
      expect(result.acknowledge).toBe(true);
      expect(result.data.paymentStatus).toBe('failed');
      expect(result.data.failureReason.code).toBe('4');
      expect(result.data.failureReason.message).toBe('Insufficient funds');
    });

    it('should handle invalid merchant_oid format', async () => {
      const params = {
        merchantOid: 'INVALID-FORMAT',
        status: 'success',
        totalAmount: '10000',
      };

      const validHash = generateIpnHash(params);

      const callbackData = {
        merchant_oid: params.merchantOid,
        status: params.status,
        total_amount: params.totalAmount,
        hash: validHash,
      };

      const result = await processPaymentCallback(callbackData);

      // Should still acknowledge to prevent retries
      expect(result.acknowledge).toBe(true);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid order ID');
    });
  });

  describe('handlePaymentSuccess', () => {
    it('should extract booking ID from merchant_oid', () => {
      const result = handlePaymentSuccess({
        merchant_oid: 'GNB-507f1f77bcf86cd799439011-1704312000000',
      });

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe('507f1f77bcf86cd799439011');
      expect(result.merchantOid).toBe('GNB-507f1f77bcf86cd799439011-1704312000000');
      expect(result.message).toContain('successfully');
    });

    it('should handle missing merchant_oid', () => {
      const result = handlePaymentSuccess({});

      expect(result.success).toBe(true);
      expect(result.bookingId).toBeNull();
    });
  });

  describe('handlePaymentFailure', () => {
    it('should extract booking ID and return failure message', () => {
      const result = handlePaymentFailure({
        merchant_oid: 'GNB-507f1f77bcf86cd799439011-1704312000000',
      });

      expect(result.success).toBe(false);
      expect(result.bookingId).toBe('507f1f77bcf86cd799439011');
      expect(result.message).toContain('not completed');
    });
  });

  describe('getPaymentStatus', () => {
    it('should return error for non-existent booking', async () => {
      const mockBooking = {
        findById: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      };

      const result = await getPaymentStatus('507f1f77bcf86cd799439011', mockBooking);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Booking not found');
    });

    it('should return payment status for existing booking', async () => {
      const mockBookingData = {
        status: 'paid',
        paymentMethod: 'paytr',
        amount: 150,
      };

      const mockBooking = {
        findById: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockBookingData),
          }),
        }),
      };

      const result = await getPaymentStatus('507f1f77bcf86cd799439011', mockBooking);

      expect(result.success).toBe(true);
      expect(result.data.paymentStatus).toBe('completed');
      expect(result.data.bookingStatus).toBe('paid');
      expect(result.data.paymentMethod).toBe('paytr');
      expect(result.data.amount).toBe(150);
    });

    it('should handle database errors', async () => {
      const mockBooking = {
        findById: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      };

      const result = await getPaymentStatus('507f1f77bcf86cd799439011', mockBooking);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get payment status');
    });
  });

  describe('Constants', () => {
    it('should export error codes', () => {
      expect(PAYTR_ERROR_CODES).toBeDefined();
      expect(PAYTR_ERROR_CODES['1']).toBe('Transaction declined by bank');
      expect(PAYTR_ERROR_CODES['4']).toBe('Insufficient funds');
    });

    it('should export test cards', () => {
      expect(PAYTR_TEST_CARDS).toBeDefined();
      expect(PAYTR_TEST_CARDS.success.number).toBe('4355084355084358');
      expect(PAYTR_TEST_CARDS.fail.number).toBe('4090700090700006');
      expect(PAYTR_TEST_CARDS.threeDSecure.number).toBe('5571135571135575');
    });
  });
});
