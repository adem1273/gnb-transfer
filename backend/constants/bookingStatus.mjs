/**
 * Booking status constants
 * 
 * @module constants/bookingStatus
 * @description Centralized booking status definitions for consistency across the application
 */

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  PAID: 'paid',
};

export const VALID_STATUSES = Object.values(BOOKING_STATUS);

export default BOOKING_STATUS;
