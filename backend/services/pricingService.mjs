/**
 * Pricing Service
 *
 * @module services/pricingService
 * @description Calculates transfer prices based on distance, vehicle type, and time
 */

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
  // base per km
  const perKm = 1.0; // 1 currency unit per km default
  const km = Math.max(1, distanceMeters / 1000);
  const vehicleMultiplier = { standard: 1, van: 1.4, premium: 2 }[vehicleType] || 1;
  const hour = new Date(pickupDate).getHours();
  const nightMultiplier = hour >= 0 && hour <= 6 ? 1.25 : 1.0;
  const base = Math.round(km * perKm * 100) / 100;
  const price = Math.round(base * vehicleMultiplier * nightMultiplier * 100) / 100;
  return { price, breakdown: { km, perKm, vehicleMultiplier, nightMultiplier } };
}
