/**
 * Dynamic Pricing Service
 *
 * @module services/dynamicPricingService
 * @description Adjusts tour prices based on booking trends using intelligent algorithms
 */

import cron from 'node-cron';
import Tour from '../models/Tour.mjs';
import Booking from '../models/Booking.mjs';
import logger from '../config/logger.mjs';

/**
 * Analyze booking trends for each tour
 *
 * @returns {Promise<Object>} - Map of tour IDs to trend data
 */
const analyzeBookingTrends = async () => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

    // Get bookings from last 2 weeks
    const recentBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: twoWeeksAgo },
          status: { $in: ['confirmed', 'completed', 'paid'] },
        },
      },
      {
        $group: {
          _id: '$tour',
          lastWeekBookings: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', oneWeekAgo] }, 1, 0],
            },
          },
          previousWeekBookings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', twoWeeksAgo] },
                    { $lt: ['$createdAt', oneWeekAgo] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Calculate trend for each tour
    const trendMap = new Map();

    recentBookings.forEach((item) => {
      const tourId = item._id.toString();
      const lastWeek = item.lastWeekBookings || 0;
      const prevWeek = item.previousWeekBookings || 0;

      let trend = 0;
      if (prevWeek > 0) {
        trend = ((lastWeek - prevWeek) / prevWeek) * 100;
      } else if (lastWeek > 0) {
        trend = 100; // New bookings, treat as positive trend
      }

      trendMap.set(tourId, {
        lastWeekBookings: lastWeek,
        previousWeekBookings: prevWeek,
        trend, // Percentage change
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      });
    });

    return trendMap;
  } catch (error) {
    logger.error('Failed to analyze booking trends:', { error: error.message });
    throw error;
  }
};

/**
 * Adjust tour prices based on booking trends
 * Increases price by up to 10% for high-demand tours
 * Decreases price by up to 10% for low-demand tours
 */
export const adjustPrices = async () => {
  try {
    logger.info('Starting dynamic pricing adjustment...');

    const trends = await analyzeBookingTrends();
    const tours = await Tour.find({});

    let adjustedCount = 0;
    const adjustments = [];

    for (const tour of tours) {
      const tourId = tour._id.toString();
      const trendData = trends.get(tourId);

      if (!trendData) {
        // No recent bookings for this tour - slight price decrease to stimulate demand
        const adjustment = -0.05; // -5%
        const newPrice = Math.max(
          tour.price * (1 + adjustment),
          tour.price * 0.5 // Don't go below 50% of original
        );

        await Tour.updateOne(
          { _id: tour._id },
          {
            $set: {
              price: Math.round(newPrice * 100) / 100,
              priceAdjustment: {
                previousPrice: tour.price,
                adjustment: adjustment * 100,
                reason: 'Low demand',
                appliedAt: new Date(),
              },
            },
          }
        );

        adjustments.push({
          tourId,
          title: tour.title,
          oldPrice: tour.price,
          newPrice: Math.round(newPrice * 100) / 100,
          adjustment: adjustment * 100,
          reason: 'Low demand',
        });

        adjustedCount++;
        continue;
      }

      // Calculate price adjustment based on trend
      let adjustment = 0;

      if (trendData.trend > 50) {
        // High growth - increase price by 10%
        adjustment = 0.1;
      } else if (trendData.trend > 20) {
        // Moderate growth - increase price by 5%
        adjustment = 0.05;
      } else if (trendData.trend < -50) {
        // Sharp decline - decrease price by 10%
        adjustment = -0.1;
      } else if (trendData.trend < -20) {
        // Moderate decline - decrease price by 5%
        adjustment = -0.05;
      }

      if (adjustment !== 0) {
        const newPrice = tour.price * (1 + adjustment);

        await Tour.updateOne(
          { _id: tour._id },
          {
            $set: {
              price: Math.round(newPrice * 100) / 100,
              priceAdjustment: {
                previousPrice: tour.price,
                adjustment: adjustment * 100,
                reason: trendData.direction === 'up' ? 'High demand' : 'Low demand',
                trendPercentage: Math.round(trendData.trend),
                appliedAt: new Date(),
              },
            },
          }
        );

        adjustments.push({
          tourId,
          title: tour.title,
          oldPrice: tour.price,
          newPrice: Math.round(newPrice * 100) / 100,
          adjustment: adjustment * 100,
          trend: Math.round(trendData.trend),
          reason: trendData.direction === 'up' ? 'High demand' : 'Low demand',
        });

        adjustedCount++;
      }
    }

    logger.info(`Dynamic pricing completed: ${adjustedCount} tours adjusted`, {
      adjustments,
    });

    return {
      success: true,
      adjustedCount,
      adjustments,
    };
  } catch (error) {
    logger.error('Failed to adjust prices:', { error: error.message });
    throw error;
  }
};

/**
 * Initialize dynamic pricing scheduler
 * Runs every Monday at 2:00 AM
 */
export const initDynamicPricing = () => {
  // Schedule to run every Monday at 2:00 AM
  cron.schedule('0 2 * * 1', () => {
    logger.info('Running scheduled dynamic pricing adjustment');
    adjustPrices().catch((error) => {
      logger.error('Scheduled pricing adjustment failed:', { error: error.message });
    });
  });

  logger.info('Dynamic pricing scheduler initialized (runs every Monday at 2:00 AM)');
};

export default {
  initDynamicPricing,
  adjustPrices,
  analyzeBookingTrends,
};
