/**
 * Yup validation schemas for booking forms
 */

import * as yup from 'yup';
import { VALIDATION, PAYMENT_METHODS, PASSENGER_TYPES } from '../constants';

/**
 * Phone number validation schema
 */
export const phoneSchema = yup
  .string()
  .required('Phone number is required')
  .test(
    'phone-valid',
    `Phone number must have at least ${VALIDATION.PHONE.MIN_DIGITS} digits`,
    (value) => {
      if (!value) return false;
      const digits = value.replace(/\D/g, '');
      return digits.length >= VALIDATION.PHONE.MIN_DIGITS;
    }
  );

/**
 * Passenger validation schema
 */
export const passengerSchema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters')
    .trim(),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters')
    .trim(),
  type: yup
    .string()
    .oneOf(Object.values(PASSENGER_TYPES), 'Invalid passenger type')
    .default(PASSENGER_TYPES.ADULT),
});

/**
 * Extra service validation schema
 */
export const extraServiceSchema = yup.object({
  selected: yup.boolean().default(false),
  quantity: yup.number().min(0).max(10).default(0),
  price: yup.number().min(0).default(0),
});

/**
 * Extra services validation schema
 */
export const extraServicesSchema = yup.object({
  childSeat: extraServiceSchema.optional(),
  babySeat: extraServiceSchema.optional(),
  meetAndGreet: extraServiceSchema.optional(),
  vipLounge: extraServiceSchema.optional(),
});

/**
 * Booking form validation schema (Step 1: Contact Information)
 */
export const bookingStep1Schema = yup.object({
  name: yup
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
    .trim(),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .lowercase()
    .trim(),
  phone: phoneSchema,
  phoneCountryCode: yup.string().default('+90'),
});

/**
 * Booking form validation schema (Step 2: Transfer Details)
 */
export const bookingStep2Schema = yup.object({
  tourId: yup.string().required('Please select a service'),
  date: yup.string().required('Date is required'),
  time: yup.string().optional(),
  flightNumber: yup
    .string()
    .optional()
    .uppercase()
    .trim()
    .max(20, 'Flight number is too long'),
  pickupLocation: yup
    .string()
    .optional()
    .max(200, 'Pickup location cannot exceed 200 characters')
    .trim(),
});

/**
 * Booking form validation schema (Step 3: Passengers)
 */
export const bookingStep3Schema = yup.object({
  adultsCount: yup
    .number()
    .required('Number of adults is required')
    .min(1, 'At least 1 adult is required')
    .max(VALIDATION.GUESTS.MAX, `Cannot exceed ${VALIDATION.GUESTS.MAX} adults`)
    .integer(),
  childrenCount: yup
    .number()
    .min(0, 'Children count cannot be negative')
    .max(VALIDATION.GUESTS.MAX, `Cannot exceed ${VALIDATION.GUESTS.MAX} children`)
    .integer()
    .default(0),
  infantsCount: yup
    .number()
    .min(0, 'Infants count cannot be negative')
    .max(20, 'Cannot exceed 20 infants')
    .integer()
    .default(0),
  passengers: yup
    .array()
    .of(passengerSchema)
    .min(1, 'At least one passenger name is required (Ministry regulation)')
    .required('Passenger names are required'),
  extraServices: extraServicesSchema.optional(),
});

/**
 * Booking form validation schema (Step 4: Review & Payment)
 */
export const bookingStep4Schema = yup.object({
  notes: yup
    .string()
    .optional()
    .max(VALIDATION.NOTES.MAX_LENGTH, `Notes cannot exceed ${VALIDATION.NOTES.MAX_LENGTH} characters`)
    .trim(),
  paymentMethod: yup
    .string()
    .oneOf(Object.values(PAYMENT_METHODS), 'Invalid payment method')
    .required('Payment method is required'),
  discountCode: yup.string().optional().trim(),
});

/**
 * Complete booking form validation schema
 */
export const bookingSchema = yup.object({
  // Step 1: Contact
  name: yup
    .string()
    .required('Name is required')
    .min(VALIDATION.NAME.MIN_LENGTH, `Name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`)
    .max(VALIDATION.NAME.MAX_LENGTH, `Name cannot exceed ${VALIDATION.NAME.MAX_LENGTH} characters`)
    .trim(),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .lowercase()
    .trim(),
  phone: phoneSchema,
  phoneCountryCode: yup.string().default('+90'),

  // Step 2: Details
  tourId: yup.string().required('Please select a service'),
  date: yup.string().required('Date is required'),
  time: yup.string().optional(),
  flightNumber: yup.string().optional().uppercase().trim(),
  pickupLocation: yup.string().optional().trim(),

  // Step 3: Passengers
  adultsCount: yup
    .number()
    .required('Number of adults is required')
    .min(1, 'At least 1 adult is required')
    .max(VALIDATION.GUESTS.MAX, `Cannot exceed ${VALIDATION.GUESTS.MAX} adults`)
    .integer(),
  childrenCount: yup.number().min(0).max(VALIDATION.GUESTS.MAX, `Cannot exceed ${VALIDATION.GUESTS.MAX} children`).integer().default(0),
  infantsCount: yup.number().min(0).max(20, 'Cannot exceed 20 infants').integer().default(0),
  passengers: yup
    .array()
    .of(passengerSchema)
    .min(1, 'At least one passenger name is required')
    .required(),
  extraServices: extraServicesSchema.optional(),

  // Step 4: Payment
  notes: yup.string().optional().max(VALIDATION.NOTES.MAX_LENGTH).trim(),
  paymentMethod: yup
    .string()
    .oneOf(Object.values(PAYMENT_METHODS))
    .required('Payment method is required'),
  discountCode: yup.string().optional().trim(),
});

/**
 * Quick booking form validation (simplified)
 */
export const quickBookingSchema = yup.object({
  name: yup.string().required('Name is required').trim(),
  email: yup.string().required('Email is required').email('Invalid email').trim(),
  phone: yup.string().required('Phone is required'),
  tourId: yup.string().required('Please select a service'),
  date: yup.string().required('Date is required'),
  guests: yup
    .number()
    .required('Number of guests is required')
    .min(VALIDATION.GUESTS.MIN)
    .max(VALIDATION.GUESTS.MAX)
    .integer(),
});

// Type exports for form values
export type PassengerFormValues = yup.InferType<typeof passengerSchema>;
export type BookingStep1Values = yup.InferType<typeof bookingStep1Schema>;
export type BookingStep2Values = yup.InferType<typeof bookingStep2Schema>;
export type BookingStep3Values = yup.InferType<typeof bookingStep3Schema>;
export type BookingStep4Values = yup.InferType<typeof bookingStep4Schema>;
export type BookingFormValues = yup.InferType<typeof bookingSchema>;
export type QuickBookingFormValues = yup.InferType<typeof quickBookingSchema>;

// Export all booking validators
export const bookingValidators = {
  phoneSchema,
  passengerSchema,
  extraServiceSchema,
  extraServicesSchema,
  bookingStep1Schema,
  bookingStep2Schema,
  bookingStep3Schema,
  bookingStep4Schema,
  bookingSchema,
  quickBookingSchema,
};

export default bookingValidators;
