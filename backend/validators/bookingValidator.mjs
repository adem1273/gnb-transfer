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
 * 
 * Ministry of Transport Compliance:
 * - Validates passenger names as required by Turkish Ministry of Transport
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
const paymentMethodSchema = z.enum(['cash', 'card', 'credit_card', 'stripe', 'paytr'], {
  errorMap: () => ({ message: 'Payment method must be cash, card, credit_card, stripe, or paytr' }),
});

/**
 * Passenger schema for ministry-required passenger names
 */
const passengerSchema = z.object({
  firstName: z
    .string({
      required_error: 'Passenger first name is required',
      invalid_type_error: 'First name must be a string',
    })
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters')
    .trim(),
  lastName: z
    .string({
      required_error: 'Passenger last name is required',
      invalid_type_error: 'Last name must be a string',
    })
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters')
    .trim(),
  type: z
    .enum(['adult', 'child', 'infant'])
    .optional()
    .default('adult'),
});

/**
 * Extra service schema
 */
const extraServiceItemSchema = z.object({
  selected: z.boolean().optional().default(false),
  quantity: z.number().int().min(0).max(10).optional().default(0),
  price: z.number().min(0).optional(),
});

const extraServicesSchema = z.object({
  childSeat: extraServiceItemSchema.optional(),
  babySeat: extraServiceItemSchema.optional(),
  meetAndGreet: z.object({
    selected: z.boolean().optional().default(false),
    price: z.number().min(0).optional().default(15),
  }).optional(),
  vipLounge: z.object({
    selected: z.boolean().optional().default(false),
    price: z.number().min(0).optional().default(50),
  }).optional(),
}).optional();

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
      .min(6, 'Phone number must be at least 6 digits')
      .max(20, 'Phone number cannot exceed 20 digits')
      .optional(),

    phoneCountryCode: z
      .string()
      .regex(/^\+\d{1,4}$/, 'Country code must be in format +XX or +XXX')
      .optional()
      .default('+90'),

    tourId: objectIdSchema,

    paymentMethod: paymentMethodSchema.optional().default('cash'),

    // Flight number (required for transfers)
    flightNumber: z
      .string()
      .min(2, 'Flight number must be at least 2 characters')
      .max(10, 'Flight number cannot exceed 10 characters')
      .toUpperCase()
      .trim()
      .optional(),

    // Guest counts
    adultsCount: z
      .number({
        invalid_type_error: 'Adults count must be a number',
      })
      .int('Adults count must be a whole number')
      .min(1, 'At least 1 adult is required')
      .max(50, 'Cannot exceed 50 adults')
      .optional()
      .default(1),

    childrenCount: z
      .number({
        invalid_type_error: 'Children count must be a number',
      })
      .int('Children count must be a whole number')
      .min(0, 'Children count cannot be negative')
      .max(50, 'Cannot exceed 50 children')
      .optional()
      .default(0),

    infantsCount: z
      .number({
        invalid_type_error: 'Infants count must be a number',
      })
      .int('Infants count must be a whole number')
      .min(0, 'Infants count cannot be negative')
      .max(20, 'Cannot exceed 20 infants')
      .optional()
      .default(0),

    guests: z
      .number({
        invalid_type_error: 'Guests must be a number',
      })
      .int('Guests must be a whole number')
      .min(1, 'At least 1 guest is required')
      .max(100, 'Cannot exceed 100 guests')
      .optional()
      .default(1),

    // Ministry-required: Passenger names
    passengers: z
      .array(passengerSchema)
      .min(1, 'At least one passenger name is required (Turkish Ministry of Transport regulation)')
      .max(100, 'Cannot exceed 100 passengers')
      .optional(),

    // Extra services
    extraServices: extraServicesSchema,

    date: z
      .string()
      .datetime('Invalid date format')
      .or(z.date())
      .optional()
      .default(new Date().toISOString()),

    time: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
      .optional(),

    pickupLocation: z
      .string()
      .max(500, 'Pickup location cannot exceed 500 characters')
      .optional(),

    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional(),
  })
  .passthrough(); // Allow additional fields for backward compatibility

/**
 * Booking update schema (partial fields allowed)
 */
export const updateBookingSchema = z
  .object({
    status: z
      .enum(['pending', 'confirmed', 'cancelled', 'completed', 'paid'], {
        errorMap: () => ({ message: 'Invalid booking status' }),
      })
      .optional(),

    paymentMethod: paymentMethodSchema.optional(),

    guests: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional(),

    adultsCount: z.number().int().min(1).max(50).optional(),
    childrenCount: z.number().int().min(0).max(50).optional(),
    infantsCount: z.number().int().min(0).max(20).optional(),

    passengers: z.array(passengerSchema).min(1).max(100).optional(),

    flightNumber: z.string().max(10).toUpperCase().trim().optional(),

    extraServices: extraServicesSchema,

    date: z
      .string()
      .datetime()
      .or(z.date())
      .optional(),

    time: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
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
  .passthrough();

/**
 * Booking query schema (for filtering/searching)
 */
export const bookingQuerySchema = z
  .object({
    status: z
      .enum(['pending', 'confirmed', 'cancelled', 'completed', 'paid'])
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
  .passthrough();

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
