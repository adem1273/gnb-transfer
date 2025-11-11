/**
 * Booking Validators using Zod
 *
 * @module validators/bookingValidator
 * @description Type-safe validation schemas for booking operations using Zod
 *
 * Security benefits:
 * - Strict type checking prevents unexpected data types
 * - Rejects unknown fields to prevent parameter pollution
 * - Validates all inputs before they reach business logic
 * - Provides clear error messages for debugging
 */

import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * MongoDB ObjectId validation
 */
const objectIdSchema = z
  .string()
  .length(24, 'Invalid ID format')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

/**
 * Payment method enum
 */
const paymentMethodSchema = z.enum(['cash', 'card', 'stripe'], {
  errorMap: () => ({ message: 'Payment method must be cash, card, or stripe' }),
});

/**
 * Booking creation schema
 */
export const createBookingSchema = z
  .object({
    name: z
      .string({
        required_error: 'Name is required',
        invalid_type_error: 'Name must be a string',
      })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),

    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
      })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),

    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number cannot exceed 15 digits')
      .optional(),

    tourId: objectIdSchema,

    paymentMethod: paymentMethodSchema.optional().default('cash'),

    guests: z
      .number({
        invalid_type_error: 'Guests must be a number',
      })
      .int('Guests must be a whole number')
      .min(1, 'At least 1 guest is required')
      .max(50, 'Cannot exceed 50 guests')
      .optional()
      .default(1),

    date: z
      .string()
      .datetime('Invalid date format')
      .or(z.date())
      .optional()
      .default(new Date().toISOString()),

    pickupLocation: z
      .string()
      .max(500, 'Pickup location cannot exceed 500 characters')
      .optional(),

    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional(),
  })
  .strict(); // Reject unknown fields

/**
 * Booking update schema (partial fields allowed)
 */
export const updateBookingSchema = z
  .object({
    status: z
      .enum(['pending', 'confirmed', 'cancelled', 'completed'], {
        errorMap: () => ({ message: 'Invalid booking status' }),
      })
      .optional(),

    paymentMethod: paymentMethodSchema.optional(),

    guests: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional(),

    date: z
      .string()
      .datetime()
      .or(z.date())
      .optional(),

    pickupLocation: z
      .string()
      .max(500)
      .optional(),

    notes: z
      .string()
      .max(1000)
      .optional(),
  })
  .strict();

/**
 * Booking query schema (for filtering/searching)
 */
export const bookingQuerySchema = z
  .object({
    status: z
      .enum(['pending', 'confirmed', 'cancelled', 'completed'])
      .optional(),

    tourId: objectIdSchema.optional(),

    userId: objectIdSchema.optional(),

    startDate: z
      .string()
      .datetime()
      .optional(),

    endDate: z
      .string()
      .datetime()
      .optional(),

    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .refine((n) => n >= 1, 'Page must be at least 1')
      .optional()
      .default('1'),

    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .refine((n) => n >= 1 && n <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('10'),

    sortBy: z
      .enum(['createdAt', 'date', 'amount', 'status'])
      .optional()
      .default('createdAt'),

    sortOrder: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc'),
  })
  .strict();

/**
 * Middleware factory for Zod validation
 *
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 * @returns {function} - Express middleware function
 *
 * Usage:
 * router.post('/bookings', validateZod(createBookingSchema, 'body'), handler);
 */
export const validateZod = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];

      // Validate and parse data
      const parsed = schema.parse(dataToValidate);

      // Replace original data with parsed (sanitized) data
      req[source] = parsed;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod errors for API response
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.apiError(
          `Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`,
          400
        );
      }

      console.error('Validation error:', error);
      return res.apiError('Invalid request data', 400);
    }
  };
};

/**
 * Validate MongoDB ObjectId middleware
 *
 * @param {string} paramName - Name of the URL parameter to validate
 * @returns {function} - Express middleware function
 *
 * Usage:
 * router.get('/bookings/:id', validateObjectId('id'), handler);
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.apiError(`Invalid ${paramName}: must be a valid MongoDB ObjectId`, 400);
    }

    next();
  };
};

export default {
  createBookingSchema,
  updateBookingSchema,
  bookingQuerySchema,
  validateZod,
  validateObjectId,
};
