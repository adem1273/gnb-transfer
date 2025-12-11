/**
 * Pricing Service
 *
 * @module services/pricingService
 * @description Calculates transfer prices based on distance, vehicle type, time, campaigns, and seasonal multipliers
 */

import Campaign from '../models/Campaign.mjs';
import logger from '../config/logger.mjs';

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
 * Get active season multiplier
 * @returns {Promise<number>} Season multiplier (default 1.0)
 */
async function getSeasonMultiplier(date = new Date()) {
  try {
    const seasonCampaigns = await Campaign.find({
      active: true,
      type: 'seasonal_multiplier',
      startDate: { $lte: date },
      endDate: { $gte: date },
    })
      .sort({ priority: -1 })
      .limit(1);

    return seasonCampaigns[0]?.seasonMultiplier || 1.0;
  } catch (error) {
    logger.error('Error fetching season multiplier:', { error: error.message });
    return 1.0;
  }
}

/**
 * Calculate price for a transfer with campaigns and seasonal adjustments
 *
 * @param {Object} options - Pricing options
 * @param {number} options.distanceMeters - Distance in meters
 * @param {string} [options.vehicleType='standard'] - Vehicle type (standard, van, premium)
 * @param {Date|string} [options.pickupDate=new Date()] - Pickup date/time for time-based modifiers
 * @param {string} [options.origin] - Origin location for route-specific campaigns
 * @param {string} [options.destination] - Destination location for route-specific campaigns
 * @param {string} [options.tourId] - Tour ID for tour-specific campaigns
 * @param {boolean} [options.includeCampaigns=true] - Whether to apply campaigns
 * @returns {Promise<Object>} Price result with breakdown
 */
export async function calculatePrice({
  distanceMeters,
  vehicleType = 'standard',
  pickupDate = new Date(),
  origin,
  destination,
  tourId,
  includeCampaigns = true,
}) {
  const perKm = BASE_RATE_PER_KM;
  // Enforce minimum distance to cover base operating costs
  const km = Math.max(MIN_DISTANCE_KM, distanceMeters / 1000);
  const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1;
  const hour = new Date(pickupDate).getHours();
  
  // Apply night surcharge for pickups between midnight and early morning
  const nightMultiplier =
    hour >= NIGHT_START_HOUR && hour <= NIGHT_END_HOUR ? NIGHT_SURCHARGE_MULTIPLIER : 1.0;
  
  // Get season multiplier
  const seasonMultiplier = await getSeasonMultiplier(new Date(pickupDate));
  
  // Calculate base price
  const base = Math.round(km * perKm * 100) / 100;
  const priceBeforeCampaigns = Math.round(base * vehicleMultiplier * nightMultiplier * seasonMultiplier * 100) / 100;
  
  let finalPrice = priceBeforeCampaigns;
  let appliedCampaign = null;
  let discount = 0;
  
  // Apply campaigns if requested
  if (includeCampaigns) {
    try {
      const applicableCampaigns = await Campaign.findApplicableCampaigns({
        origin,
        destination,
        tourId,
        bookingAmount: priceBeforeCampaigns,
        date: new Date(pickupDate),
      });
      
      if (applicableCampaigns.length > 0) {
        // Use the first (highest priority) campaign
        const campaign = new Campaign(applicableCampaigns[0]);
        discount = campaign.calculateDiscount(priceBeforeCampaigns);
        finalPrice = priceBeforeCampaigns - discount;
        appliedCampaign = {
          id: applicableCampaigns[0]._id,
          name: applicableCampaigns[0].name,
          code: applicableCampaigns[0].couponCode,
          discount,
        };
      }
    } catch (error) {
      logger.error('Error applying campaigns to price:', { error: error.message });
      // Continue with price calculation without campaigns
    }
  }
  
  return {
    price: Math.round(finalPrice * 100) / 100,
    originalPrice: priceBeforeCampaigns,
    discount,
    campaign: appliedCampaign,
    breakdown: {
      km,
      perKm,
      vehicleMultiplier,
      nightMultiplier,
      seasonMultiplier,
      basePrice: base,
    },
  };
}

/**
 * Synchronous version for backward compatibility (without campaigns)
 */
export function calculatePriceSync({
  distanceMeters,
  vehicleType = 'standard',
  pickupDate = new Date(),
}) {
  const perKm = BASE_RATE_PER_KM;
  const km = Math.max(MIN_DISTANCE_KM, distanceMeters / 1000);
  const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1;
  const hour = new Date(pickupDate).getHours();
  const nightMultiplier =
    hour >= NIGHT_START_HOUR && hour <= NIGHT_END_HOUR ? NIGHT_SURCHARGE_MULTIPLIER : 1.0;
  const base = Math.round(km * perKm * 100) / 100;
  const price = Math.round(base * vehicleMultiplier * nightMultiplier * 100) / 100;
  return { price, breakdown: { km, perKm, vehicleMultiplier, nightMultiplier } };
}
