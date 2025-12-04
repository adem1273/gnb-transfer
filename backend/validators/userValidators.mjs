/**
 * User validation schemas
 * Provides reusable validation rules for user-related operations
 * @module validators/userValidators
 */

import { body } from 'express-validator';
import { handleValidationErrors } from './index.mjs';

/**
 * Registration validation rules
 * - Name: Required, 2-100 characters
 * - Email: Required, valid email format
 * - Password: Required, min 6 characters, must contain uppercase, lowercase, and number
 */
export const registerValidator = [
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
 * Login validation rules
 * - Email: Required, valid email format
 * - Password: Required
 */
export const loginValidator = [
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
 * Password reset request validation rules
 * - Email: Required, valid email format
 */
export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  handleValidationErrors,
];

/**
 * Password reset validation rules
 * - Password: Required, min 6 characters, must contain uppercase, lowercase, and number
 */
export const resetPasswordValidator = [
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
 * Profile update validation rules
 * - Name: Optional, 2-100 characters if provided
 * - Email: Optional, valid email format if provided
 */
export const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  handleValidationErrors,
];

/**
 * Change password validation rules
 * - currentPassword: Required
 * - newPassword: Required, min 6 characters, must contain uppercase, lowercase, and number
 */
export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  handleValidationErrors,
];

export default {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  changePasswordValidator,
};
