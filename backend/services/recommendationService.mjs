/**
 * Smart Tour Recommendation Service
 * 
 * @module services/recommendationService
 * @description Provides intelligent tour recommendations based on booking frequency, ratings, and destinations
 */

import Tour from '../models/Tour.mjs';
import Booking from '../models/Booking.mjs';
import logger from '../config/logger.mjs';

/**
 * Get smart tour recommendations based on booking patterns
 * 
 * @param {Object} options - Recommendation options
 * @param {number} options.limit - Number of recommendations to return
 * @param {string} options.userId - Optional user ID for personalized recommendations
 * @returns {Promise<Array>} - Array of recommended tours with scores
 */
export const getSmartRecommendations = async ({ limit = 10, userId = null } = {}) => {
  try {
    // Aggregate booking statistics per tour
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed', 'paid'] }
        }
      },
      {
        $group: {
          _id: '$tour',
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          avgGuests: { $avg: '$guests' },
          recentBookings: {
            $sum: {
              $cond: [
                {
                  $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'tours',
          localField: '_id',
          foreignField: '_id',
          as: 'tourData'
        }
      },
      {
        $unwind: {
          path: '$tourData',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $addFields: {
          // Calculate recommendation score
          // Formula: (bookingCount * 2) + (recentBookings * 5) + (price discount factor)
          recommendationScore: {
            $add: [
              { $multiply: ['$bookingCount', 2] },
              { $multiply: ['$recentBookings', 5] },
              // Bonus for tours with discounts
              {
                $cond: [
                  { $gt: ['$tourData.discount', 0] },
                  10,
                  0
                ]
              }
            ]
          }
        }
      },
      {
        $sort: { recommendationScore: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          tour: '$tourData',
          bookingCount: 1,
          recentBookings: 1,
          totalRevenue: 1,
          avgGuests: 1,
          recommendationScore: 1
        }
      }
    ]);

    // If no bookings exist yet, return popular tours by price/discount
    if (bookingStats.length === 0) {
      const fallbackTours = await Tour.find({})
        .sort({ discount: -1, price: 1 })
        .limit(limit);

      return fallbackTours.map(tour => ({
        tour,
        bookingCount: 0,
        recentBookings: 0,
        totalRevenue: 0,
        avgGuests: 0,
        recommendationScore: tour.discount || 0
      }));
    }

    return bookingStats;
  } catch (error) {
    logger.error('Failed to get smart recommendations:', { error: error.message });
    throw error;
  }
};

/**
 * Get trending destinations based on recent bookings
 * 
 * @returns {Promise<Array>} - Array of trending destinations with booking counts
 */
export const getTrendingDestinations = async () => {
  try {
    // This requires tours to have destination field
    // For now, we'll analyze title/description patterns
    const recentBookings = await Booking.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      status: { $in: ['confirmed', 'completed', 'paid'] }
    }).populate('tour');

    // Count bookings per tour
    const destinationMap = new Map();
    
    recentBookings.forEach(booking => {
      if (booking.tour && booking.tour.title) {
        const tourId = booking.tour._id.toString();
        const tourTitle = booking.tour.title;
        
        if (!destinationMap.has(tourId)) {
          destinationMap.set(tourId, {
            tour: booking.tour,
            count: 0
          });
        }
        
        destinationMap.get(tourId).count += 1;
      }
    });

    // Convert to array and sort
    const trending = Array.from(destinationMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return trending;
  } catch (error) {
    logger.error('Failed to get trending destinations:', { error: error.message });
    throw error;
  }
};

export default {
  getSmartRecommendations,
  getTrendingDestinations
};
