/**
 * Yup validation schemas for authentication forms
 */

import * as yup from 'yup';
import { VALIDATION } from '../constants';

/**
 * Email validation schema
 */
export const emailSchema = yup
  .string()
  .required('Email is required')
  .email('Please enter a valid email address')
  .lowercase()
  .trim();

/**
 * Password validation schema
 * Requires minimum 8 characters, uppercase, lowercase, and number
 */
export const passwordSchema = yup
  .string()
  .required('Password is required')
  .min(
    VALIDATION.PASSWORD.MIN_LENGTH,
    `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`
  )
  .test(
    'uppercase',
    'Password must contain at least one uppercase letter',
    (value) => !VALIDATION.PASSWORD.REQUIRE_UPPERCASE || /[A-Z]/.test(value || '')
  )
  .test(
    'lowercase',
    'Password must contain at least one lowercase letter',
    (value) => !VALIDATION.PASSWORD.REQUIRE_LOWERCASE || /[a-z]/.test(value || '')
  )
  .test(
    'number',
    'Password must contain at least one number',
    (value) => !VALIDATION.PASSWORD.REQUIRE_NUMBER || /\d/.test(value || '')
  );

/**
 * Name validation schema
 */
export const nameSchema = yup
  .string()
  .required('Name is required')
  .min(
    VALIDATION.NAME.MIN_LENGTH,
    `Name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`
  )
  .max(
    VALIDATION.NAME.MAX_LENGTH,
    `Name cannot exceed ${VALIDATION.NAME.MAX_LENGTH} characters`
  )
  .trim();

/**
 * Login form validation schema
 */
export const loginSchema = yup.object({
  email: emailSchema,
  password: yup.string().required('Password is required'),
});

/**
 * Registration form validation schema
 */
export const registerSchema = yup.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = yup.object({
  email: emailSchema,
});

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = yup.object({
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

/**
 * Profile update validation schema
 */
export const profileUpdateSchema = yup.object({
  name: nameSchema,
  email: emailSchema,
  phone: yup
    .string()
    .optional()
    .test(
      'phone-valid',
      `Phone number must have at least ${VALIDATION.PHONE.MIN_DIGITS} digits`,
      (value) => {
        if (!value) return true;
        const digits = value.replace(/\D/g, '');
        return digits.length >= VALIDATION.PHONE.MIN_DIGITS;
      }
    ),
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
});

// Type exports for form values
export type LoginFormValues = yup.InferType<typeof loginSchema>;
export type RegisterFormValues = yup.InferType<typeof registerSchema>;
export type ForgotPasswordFormValues = yup.InferType<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = yup.InferType<typeof resetPasswordSchema>;
export type ProfileUpdateFormValues = yup.InferType<typeof profileUpdateSchema>;
export type ChangePasswordFormValues = yup.InferType<typeof changePasswordSchema>;

// Export all auth validators
export const authValidators = {
  emailSchema,
  passwordSchema,
  nameSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileUpdateSchema,
  changePasswordSchema,
};

export default authValidators;
