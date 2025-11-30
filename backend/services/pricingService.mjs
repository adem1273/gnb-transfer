/**
 * Pricing Service
 *
 * @module services/pricingService
 * @description Calculates transfer prices based on distance, vehicle type, and time
 */

// Pricing constants
const BASE_RATE_PER_KM = 1.0; // 1 currency unit per km default
const MIN_DISTANCE_KM = 1; // Minimum billable distance to cover base operating costs
const NIGHT_START_HOUR = 0; // Night surcharge starts at midnight
const NIGHT_END_HOUR = 6; // Night surcharge ends at 6 AM
const NIGHT_SURCHARGE_MULTIPLIER = 1.25; // 25% surcharge for night hours

// Vehicle type multipliers
const VEHICLE_MULTIPLIERS = {
  standard: 1,
  van: 1.4,
  premium: 2,
};

/**
 * Valid vehicle types for pricing
 */
export const VALID_VEHICLE_TYPES = Object.keys(VEHICLE_MULTIPLIERS);

/**
 * Calculate price for a transfer
 *
 * @param {Object} options - Pricing options
 * @param {number} options.distanceMeters - Distance in meters
 * @param {string} [options.vehicleType='standard'] - Vehicle type (standard, van, premium)
 * @param {Date|string} [options.pickupDate=new Date()] - Pickup date/time for time-based modifiers
 * @returns {Object} Price result with breakdown
 * @returns {number} result.price - Final calculated price
 * @returns {Object} result.breakdown - Price breakdown details
 * @returns {number} result.breakdown.km - Distance in kilometers
 * @returns {number} result.breakdown.perKm - Price per kilometer
 * @returns {number} result.breakdown.vehicleMultiplier - Vehicle type multiplier
 * @returns {number} result.breakdown.nightMultiplier - Night surcharge multiplier
 */
export function calculatePrice({
  distanceMeters,
  vehicleType = 'standard',
  pickupDate = new Date(),
}) {
  const perKm = BASE_RATE_PER_KM;
  // Enforce minimum distance to cover base operating costs
  const km = Math.max(MIN_DISTANCE_KM, distanceMeters / 1000);
  const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1;
  const hour = new Date(pickupDate).getHours();
  // Apply night surcharge for pickups between midnight and early morning
  const nightMultiplier =
    hour >= NIGHT_START_HOUR && hour <= NIGHT_END_HOUR ? NIGHT_SURCHARGE_MULTIPLIER : 1.0;
  const base = Math.round(km * perKm * 100) / 100;
  const price = Math.round(base * vehicleMultiplier * nightMultiplier * 100) / 100;
  return { price, breakdown: { km, perKm, vehicleMultiplier, nightMultiplier } };
}
