/**
 * Weekly Report Service
 * 
 * @module services/weeklyReportService
 * @description Sends weekly booking summary emails to administrators
 */

import cron from 'node-cron';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import User from '../models/User.mjs';
import { sendEmail } from './emailService.mjs';
import logger from '../config/logger.mjs';

/**
 * Generate weekly booking summary
 * 
 * @returns {Promise<Object>} - Weekly summary data
 */
const generateWeeklySummary = async () => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Get weekly bookings
    const weeklyBookings = await Booking.find({
      createdAt: { $gte: oneWeekAgo },
      status: { $in: ['confirmed', 'completed', 'paid'] }
    }).populate('tour');

    // Calculate statistics
    const totalBookings = weeklyBookings.length;
    const totalRevenue = weeklyBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Find most popular tour
    const tourBookings = new Map();
    weeklyBookings.forEach(booking => {
      if (booking.tour) {
        const tourId = booking.tour._id.toString();
        const tourTitle = booking.tour.title;
        
        if (!tourBookings.has(tourId)) {
          tourBookings.set(tourId, { title: tourTitle, count: 0, revenue: 0 });
        }
        
        const tourData = tourBookings.get(tourId);
        tourData.count += 1;
        tourData.revenue += booking.amount || 0;
      }
    });

    const topTours = Array.from(tourBookings.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get booking status breakdown
    const statusCounts = {
      confirmed: 0,
      completed: 0,
      paid: 0,
      pending: 0,
      cancelled: 0
    };

    const allWeeklyBookings = await Booking.find({
      createdAt: { $gte: oneWeekAgo }
    });

    allWeeklyBookings.forEach(booking => {
      if (statusCounts.hasOwnProperty(booking.status)) {
        statusCounts[booking.status] += 1;
      }
    });

    // Get new users
    const newUsers = await User.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    // Compare with previous week
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const previousWeekBookings = await Booking.countDocuments({
      createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
      status: { $in: ['confirmed', 'completed', 'paid'] }
    });

    const bookingGrowth = previousWeekBookings > 0
      ? ((totalBookings - previousWeekBookings) / previousWeekBookings * 100).toFixed(1)
      : totalBookings > 0 ? 100 : 0;

    return {
      period: {
        start: oneWeekAgo.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      },
      summary: {
        totalBookings,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgBookingValue: Math.round(avgBookingValue * 100) / 100,
        newUsers,
        bookingGrowth: parseFloat(bookingGrowth)
      },
      topTours,
      statusBreakdown: statusCounts
    };
  } catch (error) {
    logger.error('Failed to generate weekly summary:', { error: error.message });
    throw error;
  }
};

/**
 * Send weekly summary email to administrators
 */
export const sendWeeklySummary = async () => {
  try {
    logger.info('Generating weekly booking summary...');

    const summary = await generateWeeklySummary();

    // Get all admin users
    const admins = await User.find({ 
      role: { $in: ['admin', 'manager'] }
    });

    if (admins.length === 0) {
      logger.warn('No admin users found to send weekly summary');
      return { success: false, message: 'No admin users found' };
    }

    // Generate HTML email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .stat-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .stat-label { color: #666; font-size: 14px; margin-bottom: 5px; }
          .stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
          .growth-positive { color: #10b981; }
          .growth-negative { color: #ef4444; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #667eea; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; background: white; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Weekly Booking Summary</h1>
            <p>${summary.period.start} to ${summary.period.end}</p>
          </div>
          <div class="content">
            <div class="stat-box">
              <div class="stat-label">Total Bookings</div>
              <div class="stat-value">${summary.summary.totalBookings}</div>
              <div class="${summary.summary.bookingGrowth >= 0 ? 'growth-positive' : 'growth-negative'}">
                ${summary.summary.bookingGrowth >= 0 ? '↑' : '↓'} ${Math.abs(summary.summary.bookingGrowth)}% vs last week
              </div>
            </div>

            <div class="stat-box">
              <div class="stat-label">Total Revenue</div>
              <div class="stat-value">$${summary.summary.totalRevenue.toLocaleString()}</div>
              <div class="stat-label" style="margin-top: 10px;">Average Booking Value: $${summary.summary.avgBookingValue.toFixed(2)}</div>
            </div>

            <div class="stat-box">
              <div class="stat-label">New Users This Week</div>
              <div class="stat-value">${summary.summary.newUsers}</div>
            </div>

            ${summary.topTours.length > 0 ? `
            <div class="stat-box">
              <h3 style="margin-top: 0;">🏆 Top Performing Tours</h3>
              <table>
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  ${summary.topTours.map(tour => `
                    <tr>
                      <td>${tour.title}</td>
                      <td>${tour.count}</td>
                      <td>$${tour.revenue.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <div class="stat-box">
              <h3 style="margin-top: 0;">📈 Booking Status Breakdown</h3>
              <table>
                <tbody>
                  <tr><td>Confirmed</td><td><strong>${summary.statusBreakdown.confirmed}</strong></td></tr>
                  <tr><td>Completed</td><td><strong>${summary.statusBreakdown.completed}</strong></td></tr>
                  <tr><td>Paid</td><td><strong>${summary.statusBreakdown.paid}</strong></td></tr>
                  <tr><td>Pending</td><td><strong>${summary.statusBreakdown.pending}</strong></td></tr>
                  <tr><td>Cancelled</td><td><strong>${summary.statusBreakdown.cancelled}</strong></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated weekly report from GNB Transfer</p>
            <p>To change your notification preferences, visit the admin settings</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to all admins
    const emailPromises = admins.map(admin =>
      sendEmail({
        to: admin.email,
        subject: `📊 Weekly Booking Summary - ${summary.period.start} to ${summary.period.end}`,
        html
      })
    );

    await Promise.all(emailPromises);

    logger.info(`Weekly summary sent to ${admins.length} administrators`);

    return {
      success: true,
      recipientCount: admins.length,
      summary
    };
  } catch (error) {
    logger.error('Failed to send weekly summary:', { error: error.message });
    throw error;
  }
};

/**
 * Initialize weekly report scheduler
 * Runs every Monday at 9:00 AM
 */
export const initWeeklyReportScheduler = () => {
  // Schedule to run every Monday at 9:00 AM
  cron.schedule('0 9 * * 1', () => {
    logger.info('Running scheduled weekly report');
    sendWeeklySummary().catch(error => {
      logger.error('Scheduled weekly report failed:', { error: error.message });
    });
  });

  logger.info('Weekly report scheduler initialized (runs every Monday at 9:00 AM)');
};

export default {
  initWeeklyReportScheduler,
  sendWeeklySummary,
  generateWeeklySummary
};
