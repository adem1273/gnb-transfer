/**
 * Predictive Analytics Service
 * 
 * @module services/predictiveAnalyticsService
 * @description Provides booking forecasts using linear regression
 */

import regression from 'regression';
import Booking from '../models/Booking.mjs';
import logger from '../config/logger.mjs';

/**
 * Get booking forecast for next N days using linear regression
 * 
 * @param {number} daysToForecast - Number of days to forecast
 * @returns {Promise<Object>} - Forecast data with predictions
 */
export const getBookingForecast = async (daysToForecast = 30) => {
  try {
    // Get historical booking data from last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const bookings = await Booking.find({
      createdAt: { $gte: ninetyDaysAgo },
      status: { $in: ['confirmed', 'completed', 'paid'] }
    }).sort({ createdAt: 1 });

    if (bookings.length < 7) {
      // Not enough data for meaningful prediction
      return {
        success: false,
        message: 'Insufficient historical data for prediction (need at least 7 bookings)',
        historicalData: [],
        forecast: []
      };
    }

    // Group bookings by day
    const dailyBookings = new Map();
    const startDate = new Date(ninetyDaysAgo);
    startDate.setHours(0, 0, 0, 0);

    bookings.forEach(booking => {
      const bookingDate = new Date(booking.createdAt);
      bookingDate.setHours(0, 0, 0, 0);
      const dayKey = bookingDate.toISOString().split('T')[0];
      
      if (!dailyBookings.has(dayKey)) {
        dailyBookings.set(dayKey, {
          date: dayKey,
          count: 0,
          revenue: 0
        });
      }
      
      const dayData = dailyBookings.get(dayKey);
      dayData.count += 1;
      dayData.revenue += booking.amount || 0;
    });

    // Convert to array format for regression
    const historicalData = Array.from(dailyBookings.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Prepare data for regression (x = day index, y = booking count)
    const regressionData = historicalData.map((item, index) => [index, item.count]);

    // Perform linear regression
    const result = regression.linear(regressionData);

    // Generate forecast for next N days
    const lastDayIndex = regressionData.length - 1;
    const forecast = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysToForecast; i++) {
      const futureDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dayIndex = lastDayIndex + i;
      const predictedCount = Math.max(0, Math.round(result.predict(dayIndex)[1]));
      
      // Estimate revenue based on average revenue per booking
      const avgRevenuePerBooking = 
        historicalData.reduce((sum, d) => sum + d.revenue, 0) /
        historicalData.reduce((sum, d) => sum + d.count, 0) || 0;
      
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        predictedBookings: predictedCount,
        predictedRevenue: Math.round(predictedCount * avgRevenuePerBooking * 100) / 100
      });
    }

    // Calculate trend
    const equation = result.equation;
    const slope = equation[0];
    const trend = slope > 0 ? 'growing' : slope < 0 ? 'declining' : 'stable';

    return {
      success: true,
      historicalData: historicalData.map(item => ({
        date: item.date,
        bookings: item.count,
        revenue: Math.round(item.revenue * 100) / 100
      })),
      forecast,
      analytics: {
        equation: `y = ${equation[0].toFixed(2)}x + ${equation[1].toFixed(2)}`,
        r2: Math.round(result.r2 * 100) / 100,
        trend,
        slope: Math.round(slope * 100) / 100,
        interpretation: slope > 0 
          ? `Bookings are increasing by approximately ${Math.abs(Math.round(slope * 7))} per week`
          : slope < 0
          ? `Bookings are decreasing by approximately ${Math.abs(Math.round(slope * 7))} per week`
          : 'Bookings are relatively stable'
      }
    };
  } catch (error) {
    logger.error('Failed to generate booking forecast:', { error: error.message });
    throw error;
  }
};

/**
 * Get revenue forecast
 * 
 * @param {number} daysToForecast - Number of days to forecast
 * @returns {Promise<Object>} - Revenue forecast data
 */
export const getRevenueForecast = async (daysToForecast = 30) => {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const bookings = await Booking.find({
      createdAt: { $gte: ninetyDaysAgo },
      status: { $in: ['confirmed', 'completed', 'paid'] }
    }).sort({ createdAt: 1 });

    if (bookings.length < 7) {
      return {
        success: false,
        message: 'Insufficient data for revenue forecast'
      };
    }

    // Group revenue by day
    const dailyRevenue = new Map();

    bookings.forEach(booking => {
      const bookingDate = new Date(booking.createdAt);
      bookingDate.setHours(0, 0, 0, 0);
      const dayKey = bookingDate.toISOString().split('T')[0];
      
      if (!dailyRevenue.has(dayKey)) {
        dailyRevenue.set(dayKey, 0);
      }
      
      dailyRevenue.set(dayKey, dailyRevenue.get(dayKey) + (booking.amount || 0));
    });

    const historicalData = Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Prepare data for regression
    const regressionData = historicalData.map((item, index) => [index, item.revenue]);

    // Perform linear regression
    const result = regression.linear(regressionData);

    // Generate forecast
    const lastDayIndex = regressionData.length - 1;
    const forecast = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysToForecast; i++) {
      const futureDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dayIndex = lastDayIndex + i;
      const predictedRevenue = Math.max(0, result.predict(dayIndex)[1]);
      
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        predictedRevenue: Math.round(predictedRevenue * 100) / 100
      });
    }

    return {
      success: true,
      historicalData: historicalData.map(item => ({
        date: item.date,
        revenue: Math.round(item.revenue * 100) / 100
      })),
      forecast,
      totalPredictedRevenue: Math.round(
        forecast.reduce((sum, f) => sum + f.predictedRevenue, 0) * 100
      ) / 100
    };
  } catch (error) {
    logger.error('Failed to generate revenue forecast:', { error: error.message });
    throw error;
  }
};

export default {
  getBookingForecast,
  getRevenueForecast
};
