/**
 * Frontend Pricing Helper
 *
 * @module utils/pricing
 * @description Calculates price by calling the backend pricing API
 */

/**
 * Calculate price by calling the backend pricing API
 *
 * @param {number} distanceMeters - Distance in meters
 * @param {string} vehicleType - Vehicle type (standard, van, premium)
 * @param {Date|string} date - Pickup date/time
 * @returns {Promise<Object>} Price result with breakdown from the API
 */
export function calculateFrontendPrice(distanceMeters, vehicleType, date) {
  return fetch((import.meta.env.VITE_API_URL || '/api') + '/pricing/calc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ distanceMeters, vehicleType, date }),
  }).then((r) => r.json());
}
