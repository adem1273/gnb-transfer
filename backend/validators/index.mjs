/**
 * Validation middleware using express-validator
 * Provides reusable validation rules and error handling
 */

import { body, param, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 * Should be used after validation rules
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return res.apiError(errorMessages.join(', '), 400);
  }
  next();
};

/**
 * User registration validation rules
 */
export const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  handleValidationErrors,
];

/**
 * User login validation rules
 */
export const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

/**
 * Booking creation validation rules
 */
export const validateBookingCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('tourId')
    .notEmpty()
    .withMessage('Tour ID is required')
    .isMongoId()
    .withMessage('Invalid tour ID format'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'stripe'])
    .withMessage('Payment method must be cash, card, or stripe'),
  body('guests')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Guests must be between 1 and 50'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  handleValidationErrors,
];

/**
 * Tour creation validation rules
 */
export const validateTourCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Duration must be between 1 and 100 characters'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  body('isCampaign').optional().isBoolean().withMessage('isCampaign must be a boolean'),
  handleValidationErrors,
];

/**
 * Tour update validation rules
 */
export const validateTourUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Duration must be between 1 and 100 characters'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  body('isCampaign').optional().isBoolean().withMessage('isCampaign must be a boolean'),
  handleValidationErrors,
];

/**
 * Booking status update validation rules
 */
export const validateBookingStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'paid'])
    .withMessage('Invalid status value'),
  handleValidationErrors,
];

/**
 * MongoDB ObjectId validation for URL parameters
 */
export const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];

export default {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateBookingCreation,
  validateTourCreation,
  validateTourUpdate,
  validateBookingStatusUpdate,
  validateMongoId,
};
