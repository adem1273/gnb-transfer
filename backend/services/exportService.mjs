/**
 * Export Service
 * 
 * @module services/exportService
 * @description Export bookings, users, and revenue data to CSV and PDF formats
 */

import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import Booking from '../models/Booking.mjs';
import User from '../models/User.mjs';
import Tour from '../models/Tour.mjs';
import logger from '../config/logger.mjs';

/**
 * Export bookings to CSV
 * 
 * @param {Object} filters - Query filters
 * @returns {Promise<string>} - CSV string
 */
export const exportBookingsCSV = async (filters = {}) => {
  try {
    const bookings = await Booking.find(filters)
      .populate('tour', 'title price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const fields = [
      { label: 'Booking ID', value: '_id' },
      { label: 'Customer Name', value: 'name' },
      { label: 'Customer Email', value: 'email' },
      { label: 'Tour', value: 'tour.title' },
      { label: 'Date', value: 'date' },
      { label: 'Guests', value: 'guests' },
      { label: 'Amount', value: 'amount' },
      { label: 'Status', value: 'status' },
      { label: 'Payment Method', value: 'paymentMethod' },
      { label: 'Created At', value: 'createdAt' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(bookings);

    return csv;
  } catch (error) {
    logger.error('Failed to export bookings CSV:', { error: error.message });
    throw error;
  }
};

/**
 * Export users to CSV
 * 
 * @param {Object} filters - Query filters
 * @returns {Promise<string>} - CSV string
 */
export const exportUsersCSV = async (filters = {}) => {
  try {
    const users = await User.find(filters)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const fields = [
      { label: 'User ID', value: '_id' },
      { label: 'Name', value: 'name' },
      { label: 'Email', value: 'email' },
      { label: 'Role', value: 'role' },
      { label: 'Language', value: 'preferences.language' },
      { label: 'Registered At', value: 'createdAt' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(users);

    return csv;
  } catch (error) {
    logger.error('Failed to export users CSV:', { error: error.message });
    throw error;
  }
};

/**
 * Export revenue report to CSV
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<string>} - CSV string
 */
export const exportRevenueCSV = async (startDate, endDate) => {
  try {
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const bookings = await Booking.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          status: { $in: ['confirmed', 'completed', 'paid'] }
        }
      },
      {
        $lookup: {
          from: 'tours',
          localField: 'tour',
          foreignField: '_id',
          as: 'tourData'
        }
      },
      {
        $unwind: { path: '$tourData', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            tour: '$tourData.title'
          },
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          avgBookingValue: { $avg: '$amount' }
        }
      },
      {
        $sort: { '_id.date': -1 }
      }
    ]);

    const revenueData = bookings.map(item => ({
      date: item._id.date,
      tour: item._id.tour || 'N/A',
      bookings: item.bookingCount,
      revenue: Math.round(item.totalRevenue * 100) / 100,
      avgValue: Math.round(item.avgBookingValue * 100) / 100
    }));

    const fields = [
      { label: 'Date', value: 'date' },
      { label: 'Tour', value: 'tour' },
      { label: 'Bookings', value: 'bookings' },
      { label: 'Revenue', value: 'revenue' },
      { label: 'Avg Booking Value', value: 'avgValue' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(revenueData);

    return csv;
  } catch (error) {
    logger.error('Failed to export revenue CSV:', { error: error.message });
    throw error;
  }
};

/**
 * Generate revenue report PDF
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<PDFDocument>} - PDF document stream
 */
export const generateRevenuePDF = async (startDate, endDate) => {
  try {
    const doc = new PDFDocument({ margin: 50 });

    // Header
    doc.fontSize(20).text('GNB Transfer - Revenue Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(
      `Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'All Time'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`,
      { align: 'center' }
    );
    doc.moveDown();

    // Get data
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const bookings = await Booking.find({
      createdAt: dateFilter,
      status: { $in: ['confirmed', 'completed', 'paid'] }
    }).populate('tour', 'title');

    // Summary statistics
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Total Bookings: ${totalBookings}`);
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`);
    doc.text(`Average Booking Value: $${avgBookingValue.toFixed(2)}`);
    doc.moveDown();

    // Top tours
    const tourRevenue = new Map();
    bookings.forEach(booking => {
      if (booking.tour) {
        const tourId = booking.tour._id.toString();
        const tourTitle = booking.tour.title;
        
        if (!tourRevenue.has(tourId)) {
          tourRevenue.set(tourId, { title: tourTitle, revenue: 0, count: 0 });
        }
        
        const data = tourRevenue.get(tourId);
        data.revenue += booking.amount || 0;
        data.count += 1;
      }
    });

    const topTours = Array.from(tourRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    doc.fontSize(14).text('Top 10 Tours by Revenue', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    topTours.forEach((tour, index) => {
      doc.text(
        `${index + 1}. ${tour.title}: $${tour.revenue.toFixed(2)} (${tour.count} bookings)`
      );
    });

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text(
      `Generated on ${new Date().toLocaleString()}`,
      { align: 'center' }
    );

    doc.end();
    return doc;
  } catch (error) {
    logger.error('Failed to generate revenue PDF:', { error: error.message });
    throw error;
  }
};

/**
 * Generate bookings report PDF
 * 
 * @param {Object} filters - Query filters
 * @returns {Promise<PDFDocument>} - PDF document stream
 */
export const generateBookingsPDF = async (filters = {}) => {
  try {
    const doc = new PDFDocument({ margin: 50 });

    // Header
    doc.fontSize(20).text('GNB Transfer - Bookings Report', { align: 'center' });
    doc.moveDown(2);

    const bookings = await Booking.find(filters)
      .populate('tour', 'title')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to 100 for PDF

    doc.fontSize(12).text(`Total Bookings: ${bookings.length}`, { align: 'center' });
    doc.moveDown();

    // Table header
    doc.fontSize(10);
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 300;
    const col4 = 400;
    const col5 = 500;

    doc.text('Date', col1, tableTop, { width: 90, continued: false });
    doc.text('Customer', col2, tableTop, { width: 140 });
    doc.text('Tour', col3, tableTop, { width: 90 });
    doc.text('Amount', col4, tableTop, { width: 90 });
    doc.text('Status', col5, tableTop, { width: 90 });

    doc.moveDown();
    let currentY = doc.y;

    // Table rows
    doc.fontSize(9);
    bookings.slice(0, 30).forEach(booking => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const date = new Date(booking.createdAt).toLocaleDateString();
      const customer = booking.name || booking.user?.name || 'N/A';
      const tour = booking.tour?.title?.substring(0, 20) || 'N/A';
      const amount = `$${(booking.amount || 0).toFixed(2)}`;
      const status = booking.status;

      doc.text(date, col1, currentY, { width: 90 });
      doc.text(customer, col2, currentY, { width: 140 });
      doc.text(tour, col3, currentY, { width: 90 });
      doc.text(amount, col4, currentY, { width: 90 });
      doc.text(status, col5, currentY, { width: 90 });

      currentY += 20;
    });

    // Footer
    doc.fontSize(8).text(
      `Generated on ${new Date().toLocaleString()}`,
      50,
      750,
      { align: 'center' }
    );

    doc.end();
    return doc;
  } catch (error) {
    logger.error('Failed to generate bookings PDF:', { error: error.message });
    throw error;
  }
};

export default {
  exportBookingsCSV,
  exportUsersCSV,
  exportRevenueCSV,
  generateRevenuePDF,
  generateBookingsPDF
};
