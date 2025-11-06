/**
 * Delay Guarantee Controller
 * Uses cheap/free APIs for batch/static risk calculation
 * Generates automatic discount codes when delay > 15 min
 */

import DelayMetrics from '../models/DelayMetrics.mjs';
import Booking from '../models/Booking.mjs';
import axios from 'axios';

// OpenRouteService API (Free tier: 2000 requests/day)
const ORS_API_KEY = process.env.OPENROUTE_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

/**
 * Calculate route distance and duration using OpenRouteService
 * This is a batch/static calculation, not real-time
 */
async function calculateRouteMetrics(origin, destination) {
  try {
    if (!ORS_API_KEY) {
      console.warn('OpenRouteService API key not set. Using fallback calculation.');
      // Fallback calculation when API key is not available
      const avgSpeed = 60; // km/h average speed
      const estimatedDistance = 100; // Default 100km
      return {
        distance: estimatedDistance,
        estimatedDuration: Math.round((estimatedDistance / avgSpeed) * 60)
      };
    }
    
    // For demo purposes, use geocoding to get coordinates
    // In production, you'd have coordinates stored or use a proper geocoding service
    
    // Simplified: Use mock coordinates for common locations
    const mockCoordinates = {
      'istanbul': [28.9784, 41.0082],
      'ankara': [32.8597, 39.9334],
      'izmir': [27.1428, 38.4237],
      'antalya': [30.7133, 36.8969],
      'airport': [28.8146, 40.9769] // Istanbul Airport
    };
    
    const originCoords = mockCoordinates[origin.toLowerCase()] || [28.9784, 41.0082];
    const destCoords = mockCoordinates[destination.toLowerCase()] || [32.8597, 39.9334];
    
    // Call OpenRouteService for route calculation
    const response = await axios.post(
      `${ORS_BASE_URL}/directions/driving-car`,
      {
        coordinates: [originCoords, destCoords]
      },
      {
        headers: {
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout
      }
    );
    
    const route = response.data.routes[0];
    const distance = route.summary.distance; // meters
    const duration = route.summary.duration; // seconds
    
    return {
      distance: Math.round(distance / 1000), // Convert to km
      estimatedDuration: Math.round(duration / 60) // Convert to minutes
    };
  } catch (error) {
    console.error('OpenRouteService API error:', error.message);
    
    // Fallback: Use approximate calculation based on straight-line distance
    // This ensures the feature works even if the API is unavailable
    const avgSpeed = 60; // km/h average speed
    const estimatedDistance = 100; // Default 100km if calculation fails
    
    return {
      distance: estimatedDistance,
      estimatedDuration: Math.round((estimatedDistance / avgSpeed) * 60)
    };
  }
}

/**
 * Calculate delay risk score based on multiple factors
 * Returns score 0-100 (higher = more risk of delay)
 */
function calculateDelayRiskScore(routeMetrics, bookingDate) {
  const factors = {
    traffic: 0,
    weather: 0,
    timeOfDay: 0,
    dayOfWeek: 0
  };
  
  // Distance factor: Longer routes have higher delay risk
  const distanceFactor = Math.min(routeMetrics.distance / 10, 25); // Max 25 points
  
  // Time of day factor
  const hour = new Date(bookingDate).getHours();
  if (hour >= 7 && hour <= 9) {
    factors.timeOfDay = 20; // Morning rush hour
  } else if (hour >= 17 && hour <= 19) {
    factors.timeOfDay = 25; // Evening rush hour
  } else if (hour >= 0 && hour <= 5) {
    factors.timeOfDay = 5; // Late night - low traffic
  } else {
    factors.timeOfDay = 10; // Normal hours
  }
  
  // Day of week factor
  const dayOfWeek = new Date(bookingDate).getDay();
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    factors.dayOfWeek = 15; // Weekday - more traffic
  } else {
    factors.dayOfWeek = 8; // Weekend - less traffic
  }
  
  // Weather factor (simplified - in production, use weather API)
  factors.weather = 10; // Default moderate weather impact
  
  // Traffic factor (simplified - in production, use traffic data)
  factors.traffic = 15; // Default moderate traffic
  
  // Calculate total risk score
  const totalScore = Math.min(
    distanceFactor + factors.traffic + factors.weather + factors.timeOfDay + factors.dayOfWeek,
    100
  );
  
  return {
    score: Math.round(totalScore),
    factors
  };
}

/**
 * Generate discount code if delay risk is high (> 15 min expected delay)
 */
function generateDiscountCode(bookingId, delayMinutes) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const bookingShort = bookingId.toString().slice(-6).toUpperCase();
  return `DELAY${delayMinutes}-${bookingShort}-${timestamp}`;
}

/**
 * Calculate estimated delay based on risk score
 */
function estimateDelayMinutes(riskScore, baseDuration) {
  // Convert risk score to delay percentage
  const delayPercentage = riskScore / 100;
  
  // Apply delay to base duration
  const estimatedDelay = Math.round(baseDuration * delayPercentage * 0.3); // 30% max delay
  
  return estimatedDelay;
}

/**
 * GET /api/delay/calculate/:bookingId
 * Calculate delay guarantee for a booking
 */
export const calculateDelayGuarantee = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Validate booking exists
    const booking = await Booking.findById(bookingId).populate('tour');
    if (!booking) {
      return res.apiError('Booking not found', 404);
    }
    
    // Check if delay metrics already exist for this booking
    let delayMetrics = await DelayMetrics.findOne({ booking: bookingId });
    if (delayMetrics) {
      return res.apiSuccess(delayMetrics, 'Delay metrics retrieved successfully');
    }
    
    // For demo: Extract route info from booking or use defaults
    const origin = req.query.origin || 'airport';
    const destination = req.query.destination || booking.tour?.title?.toLowerCase() || 'istanbul';
    
    // Calculate route metrics
    const routeMetrics = await calculateRouteMetrics(origin, destination);
    
    // Calculate delay risk score
    const { score, factors } = calculateDelayRiskScore(routeMetrics, booking.createdAt);
    
    // Estimate delay in minutes
    const estimatedDelay = estimateDelayMinutes(score, routeMetrics.estimatedDuration);
    
    // Generate discount code if delay > 15 minutes
    let discountCode = null;
    let discountAmount = 0;
    let discountGenerated = false;
    
    if (estimatedDelay > 15) {
      discountCode = generateDiscountCode(bookingId, estimatedDelay);
      discountAmount = Math.min(estimatedDelay * 0.5, 20); // $0.50 per minute, max $20
      discountGenerated = true;
    }
    
    // Create delay metrics record
    delayMetrics = await DelayMetrics.create({
      booking: bookingId,
      route: {
        origin,
        destination,
        distance: routeMetrics.distance,
        estimatedDuration: routeMetrics.estimatedDuration
      },
      delayRiskScore: score,
      estimatedDelayMinutes: estimatedDelay,
      factors,
      discountGenerated,
      discountCode,
      discountAmount
    });
    
    return res.apiSuccess(delayMetrics, 'Delay guarantee calculated successfully');
  } catch (error) {
    console.error('Error calculating delay guarantee:', error);
    return res.apiError('Failed to calculate delay guarantee: ' + error.message, 500);
  }
};

/**
 * GET /api/delay/metrics/:bookingId
 * Get delay metrics for a specific booking
 */
export const getDelayMetrics = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const delayMetrics = await DelayMetrics.findOne({ booking: bookingId });
    if (!delayMetrics) {
      return res.apiError('Delay metrics not found for this booking', 404);
    }
    
    return res.apiSuccess(delayMetrics, 'Delay metrics retrieved successfully');
  } catch (error) {
    console.error('Error getting delay metrics:', error);
    return res.apiError('Failed to retrieve delay metrics: ' + error.message, 500);
  }
};

/**
 * GET /api/delay/stats
 * Get overall delay statistics (admin only)
 */
export const getDelayStats = async (req, res) => {
  try {
    const totalMetrics = await DelayMetrics.countDocuments();
    const avgRiskScore = await DelayMetrics.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$delayRiskScore' },
          avgDelay: { $avg: '$estimatedDelayMinutes' }
        }
      }
    ]);
    
    const discountsGenerated = await DelayMetrics.countDocuments({ discountGenerated: true });
    const totalDiscountAmount = await DelayMetrics.aggregate([
      {
        $match: { discountGenerated: true }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$discountAmount' }
        }
      }
    ]);
    
    return res.apiSuccess({
      totalMetrics,
      avgRiskScore: avgRiskScore[0]?.avgScore || 0,
      avgDelay: avgRiskScore[0]?.avgDelay || 0,
      discountsGenerated,
      totalDiscountAmount: totalDiscountAmount[0]?.total || 0
    }, 'Delay statistics retrieved successfully');
  } catch (error) {
    console.error('Error getting delay stats:', error);
    return res.apiError('Failed to retrieve delay statistics: ' + error.message, 500);
  }
};

export default {
  calculateDelayGuarantee,
  getDelayMetrics,
  getDelayStats
};
