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
 * @throws {Error} If the API request fails
 */
export async function calculateFrontendPrice(distanceMeters, vehicleType, date) {
  const response = await fetch((import.meta.env.VITE_API_URL || '/api') + '/pricing/calc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ distanceMeters, vehicleType, date }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Failed to calculate price');
  }

  return response.json();
}
