/**
 * AI Service
 * Handles AI-driven features including delay risk calculation and smart package recommendations
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';

// Cache for AI recommendations (TTL: 1 hour)
const packageCache = new NodeCache({ stdTTL: 3600 });
const delayCache = new NodeCache({ stdTTL: 1800 }); // 30 minutes for delay

/**
 * Mock delay risk calculation with realistic factors
 * @private
 */
async function calculateMockDelayRisk({ origin, destination, scheduledTime }) {
  // Simulate distance based on string similarity (mock)
  const distance = Math.min(50, Math.max(5, (origin.length + destination.length) * 1.5));

  // Base duration estimate (minutes)
  const estimatedDuration = Math.round(distance * 1.5);

  // Calculate risk factors
  let riskScore = 0;

  // Distance factor (longer distances = higher risk)
  if (distance > 30) riskScore += 20;
  else if (distance > 15) riskScore += 10;
  else riskScore += 5;

  // Time of day factor (peak hours = higher risk)
  const hour = scheduledTime.getHours();
  const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  if (isPeakHour) riskScore += 25;
  else if (hour >= 6 && hour <= 22) riskScore += 10;
  else riskScore += 5;

  // Day of week factor
  const dayOfWeek = scheduledTime.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (!isWeekend) riskScore += 10;

  // Add small random factor for variation
  riskScore += Math.floor(Math.random() * 15);

  // Cap at 100
  riskScore = Math.min(100, riskScore);

  // Calculate estimated delay based on risk score
  let estimatedDelay = 0;
  if (riskScore > 60) estimatedDelay = Math.floor(riskScore / 4);
  else if (riskScore > 40) estimatedDelay = Math.floor(riskScore / 6);
  else estimatedDelay = Math.floor(riskScore / 10);

  const result = {
    delayRiskScore: riskScore,
    estimatedDelay,
    route: {
      origin,
      destination,
      distance: Math.round(distance * 10) / 10,
      estimatedDuration,
    },
  };

  // Cache the result with hour-specific key
  const resultCacheKey = `delay_${origin}_${destination}_h${hour}`;
  delayCache.set(resultCacheKey, result);

  return result;
}

/**
 * Get localized tour title based on language
 * @private
 */
function getLocalizedTitle(tour, language) {
  // Validate language is supported
  const supportedLangs = ['en', 'ar', 'de', 'es', 'hi', 'it', 'ru', 'zh'];
  const safeLang = supportedLangs.includes(language) ? language : 'en';

  const langKey = `title_${safeLang}`;
  return tour[langKey] || tour.title;
}

/**
 * Rule-based package recommendation
 * @private
 */
async function generateRuleBasedPackage({ bookingHistory, availableTours, userLanguage }) {
  if (availableTours.length === 0) {
    throw new Error('No tours available for package creation');
  }

  // Get IDs of already booked tours
  const bookedTourIds = new Set(
    bookingHistory.map((b) => b.tour?._id?.toString() || b.tourId?.toString()).filter(Boolean)
  );

  // Filter out already booked tours
  const unbookedTours = availableTours.filter((tour) => !bookedTourIds.has(tour._id.toString()));

  // Select tour to recommend
  let recommendedTour;
  let reasoning;

  if (unbookedTours.length > 0) {
    // Prefer higher priced tours (better margin)
    recommendedTour = unbookedTours.reduce((prev, current) =>
      current.price > prev.price ? current : prev
    );

    if (bookingHistory.length > 0) {
      reasoning = `Based on your previous ${bookingHistory.length} booking${bookingHistory.length > 1 ? 's' : ''}, we recommend this premium experience that complements your travel history.`;
    } else {
      reasoning = 'This is one of our most popular premium tours, perfect for first-time visitors!';
    }
  } else {
    // All tours booked, recommend most expensive
    recommendedTour = availableTours.reduce((prev, current) =>
      current.price > prev.price ? current : prev
    );
    reasoning = 'Experience this amazing tour again with our special bundle discount!';
  }

  // Calculate 15% discount
  const originalPrice = recommendedTour.price;
  const bundlePrice = Math.round(originalPrice * 0.85 * 100) / 100;

  const result = {
    recommendedTour: getLocalizedTitle(recommendedTour, userLanguage),
    tourId: recommendedTour._id.toString(),
    reasoning,
    bundlePrice,
    originalPrice,
    discount: 15,
  };

  return result;
}

/**
 * Calculate delay risk score based on route and conditions
 * Uses OpenRouteService API when available, falls back to mock calculation
 *
 * @param {Object} params - Calculation parameters
 * @param {string} params.origin - Starting point
 * @param {string} params.destination - Ending point
 * @param {Date} params.scheduledTime - Scheduled departure time
 * @returns {Promise<Object>} Delay risk data
 */
export async function calculateDelayRisk({ origin, destination, scheduledTime = new Date() }) {
  // Create cache key with time component to account for peak hours
  const hour = scheduledTime.getHours();
  const cacheKey = `delay_${origin}_${destination}_h${hour}`;
  const cached = delayCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    // Fallback to mock calculation
    // TODO: In production, implement real API integration with OpenRouteService
    return await calculateMockDelayRisk({ origin, destination, scheduledTime });
  } catch (error) {
    console.error('Delay calculation error:', error.message);
    // Return safe fallback values
    return {
      delayRiskScore: 25,
      estimatedDelay: 5,
      route: {
        origin,
        destination,
        distance: 20,
        estimatedDuration: 30,
      },
    };
  }
}

/**
 * Generate discount code for delays exceeding threshold
 *
 * @param {number} delayMinutes - Estimated delay in minutes
 * @returns {string|null} Discount code or null
 */
export function generateDiscountCode(delayMinutes) {
  if (delayMinutes <= 15) return null;

  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  // Use cryptographically secure random bytes for security
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();

  return `DELAY${delayMinutes}-${timestamp}${randomBytes}`;
}

/**
 * Generate smart package recommendation for a user
 * Uses AI when available, falls back to rule-based recommendation
 *
 * @param {string} userId - User ID
 * @param {Array} bookingHistory - User's booking history
 * @param {Array} availableTours - Available tours
 * @param {string} userLanguage - User's preferred language
 * @returns {Promise<Object>} Package recommendation
 */
export async function generateSmartPackage({
  userId,
  bookingHistory,
  availableTours,
  userLanguage = 'en',
}) {
  const cacheKey = `package_${userId}`;
  const cached = packageCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    // Use mock calculation
    // Note: Real API integration with OpenAI would be implemented here
    // For Phase 3, this intentionally uses rule-based fallback logic
    const result = await generateRuleBasedPackage({
      bookingHistory,
      availableTours,
      userLanguage,
    });
    packageCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Package generation error:', error.message);
    // Return safe fallback
    if (availableTours.length > 0) {
      const tour = availableTours[0];
      return {
        recommendedTour: tour.title,
        tourId: tour._id.toString(),
        reasoning: "This is one of our most popular tours that we think you'll enjoy!",
        bundlePrice: Math.round(tour.price * 0.85 * 100) / 100,
        originalPrice: tour.price,
        discount: 15,
      };
    }
    throw new Error('No tours available for package creation');
  }
}

/**
 * Clear package recommendation cache for a user
 *
 * @param {string} userId - User ID
 */
export function clearPackageCache(userId) {
  packageCache.del(`package_${userId}`);
}

/**
 * Get cache statistics
 *
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  return {
    packages: {
      keys: packageCache.keys().length,
      hits: packageCache.getStats().hits,
      misses: packageCache.getStats().misses,
    },
    delays: {
      keys: delayCache.keys().length,
      hits: delayCache.getStats().hits,
      misses: delayCache.getStats().misses,
    },
  };
}
