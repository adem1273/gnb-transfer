/**
 * Finance Routes
 *
 * @module routes/financeRoutes
 * @description Finance panel endpoints for revenue tracking and reporting
 */

import express from 'express';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { getBookingForecast, getRevenueForecast } from '../services/predictiveAnalyticsService.mjs';
import {
  exportBookingsCSV,
  exportUsersCSV,
  exportRevenueCSV,
  generateRevenuePDF,
  generateBookingsPDF,
} from '../services/exportService.mjs';

const router = express.Router();

/**
 * @route   GET /api/finance/overview
 * @desc    Get financial overview (revenue, profit estimation)
 * @access  Private (admin, manager)
 */
router.get('/overview', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Get bookings
    const bookings = await Booking.find({
      ...query,
      status: { $in: ['confirmed', 'completed', 'paid'] },
    });

    // Calculate metrics
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalBookings = bookings.length;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Estimate costs (30% of revenue for simplicity)
    const estimatedCosts = totalRevenue * 0.3;
    const estimatedProfit = totalRevenue - estimatedCosts;
    const profitMargin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

    // Monthly breakdown
    const monthlyData = new Map();
    bookings.forEach((booking) => {
      const month = new Date(booking.createdAt).toISOString().substring(0, 7);

      if (!monthlyData.has(month)) {
        monthlyData.set(month, { bookings: 0, revenue: 0 });
      }

      const data = monthlyData.get(month);
      data.bookings += 1;
      data.revenue += booking.amount || 0;
    });

    const monthlyBreakdown = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        bookings: data.bookings,
        revenue: Math.round(data.revenue * 100) / 100,
        estimatedProfit: Math.round(data.revenue * 0.7 * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Payment method breakdown
    const paymentMethods = bookings.reduce((acc, b) => {
      const method = b.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + (b.amount || 0);
      return acc;
    }, {});

    return res.apiSuccess({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        avgBookingValue: Math.round(avgBookingValue * 100) / 100,
        estimatedCosts: Math.round(estimatedCosts * 100) / 100,
        estimatedProfit: Math.round(estimatedProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
      },
      monthlyBreakdown,
      paymentMethods,
    });
  } catch (error) {
    console.error('Error fetching finance overview:', error);
    return res.apiError('Failed to fetch finance data', 500);
  }
});

/**
 * @route   GET /api/finance/forecast
 * @desc    Get booking and revenue forecasts
 * @access  Private (admin, manager)
 */
router.get('/forecast', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysToForecast = Math.min(parseInt(days, 10), 90);

    const [bookingForecast, revenueForecast] = await Promise.all([
      getBookingForecast(daysToForecast),
      getRevenueForecast(daysToForecast),
    ]);

    return res.apiSuccess({
      bookingForecast,
      revenueForecast,
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    return res.apiError('Failed to generate forecast', 500);
  }
});

/**
 * @route   GET /api/finance/export/bookings
 * @desc    Export bookings as CSV
 * @access  Private (admin, manager)
 */
router.get('/export/bookings', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const filters = {};
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }
    if (status) filters.status = status;

    const csv = await exportBookingsCSV(filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings-export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting bookings:', error);
    return res.apiError('Failed to export bookings', 500);
  }
});

/**
 * @route   GET /api/finance/export/revenue
 * @desc    Export revenue report as CSV
 * @access  Private (admin, manager)
 */
router.get('/export/revenue', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const csv = await exportRevenueCSV(startDate, endDate);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=revenue-export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting revenue:', error);
    return res.apiError('Failed to export revenue', 500);
  }
});

/**
 * @route   GET /api/finance/export/users
 * @desc    Export users as CSV
 * @access  Private (admin only)
 */
router.get('/export/users', requireAuth(['admin']), async (req, res) => {
  try {
    const csv = await exportUsersCSV();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting users:', error);
    return res.apiError('Failed to export users', 500);
  }
});

/**
 * @route   GET /api/finance/export/revenue-pdf
 * @desc    Generate revenue report PDF
 * @access  Private (admin, manager)
 */
router.get('/export/revenue-pdf', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const pdfDoc = await generateRevenuePDF(startDate, endDate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.pdf');

    pdfDoc.pipe(res);
  } catch (error) {
    console.error('Error generating revenue PDF:', error);
    return res.apiError('Failed to generate PDF', 500);
  }
});

/**
 * @route   GET /api/finance/export/bookings-pdf
 * @desc    Generate bookings report PDF
 * @access  Private (admin, manager)
 */
router.get('/export/bookings-pdf', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const filters = {};
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }
    if (status) filters.status = status;

    const pdfDoc = await generateBookingsPDF(filters);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings-report.pdf');

    pdfDoc.pipe(res);
  } catch (error) {
    console.error('Error generating bookings PDF:', error);
    return res.apiError('Failed to generate PDF', 500);
  }
});

export default router;
