/**
 * OpenRouteService Integration Service
 *
 * @module services/orsService
 * @description Provides route calculation and distance/duration summaries using OpenRouteService API
 */

import axios from 'axios';

const ORS_KEY = process.env.ORS_API_KEY || '';

/**
 * Get route summary between two geographic points
 *
 * @param {Object} from - Start location with lat/lng coordinates
 * @param {number} from.lat - Latitude of start location
 * @param {number} from.lng - Longitude of start location
 * @param {Object} to - End location with lat/lng coordinates
 * @param {number} to.lat - Latitude of end location
 * @param {number} to.lng - Longitude of end location
 * @returns {Promise<Object|null>} Route summary with distance and duration, or null if unavailable
 * @throws {Error} If API request fails
 */
export async function getRouteSummary(from, to) {
  const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
  const res = await axios.post(
    url,
    { coordinates: [[from.lng, from.lat], [to.lng, to.lat]] },
    {
      headers: {
        Authorization: ORS_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  const summary = res.data?.features?.[0]?.properties?.summary || null;
  return summary; // { distance, duration }
}
