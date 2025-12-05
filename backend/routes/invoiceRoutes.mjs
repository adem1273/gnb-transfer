/**
 * Invoice Routes
 *
 * @module routes/invoiceRoutes
 * @description Endpoints for invoice generation and PDF exports
 */

import express from 'express';
import PDFDocument from 'pdfkit';
import Booking from '../models/Booking.mjs';
import Settings from '../models/Settings.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * Generate QR code SVG path (simple implementation)
 */
function generateSimpleQRPath(data, size = 100) {
  // This is a placeholder - in production, use a proper QR code library
  return `M0,0 h${size} v${size} h-${size}Z`;
}

/**
 * @route   GET /api/invoices/:bookingId
 * @desc    Generate PDF invoice for a booking
 * @access  Private (admin, manager, or booking owner)
 */
router.get('/:bookingId', requireAuth(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('tour', 'title')
      .populate('user', 'name email');

    if (!booking) {
      return res.apiError('Booking not found', 404);
    }

    // Check authorization
    const isAdmin = ['admin', 'manager'].includes(req.user.role);
    const isOwner = booking.user?._id?.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.apiError('Not authorized', 403);
    }

    const settings = await Settings.getGlobalSettings();
    const company = settings.company;

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers
    const invoiceNumber = `INV-${booking._id.toString().slice(-8).toUpperCase()}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoiceNumber}.pdf`);

    doc.pipe(res);

    // Header with gradient-like effect
    doc.rect(0, 0, 595, 120).fill('#667eea');

    // Company logo placeholder
    doc.fontSize(28).fillColor('#ffffff').text(company.name || 'GNB Transfer', 50, 40);

    // Invoice title
    doc.fontSize(12).text('INVOICE / FATURA', 50, 75);
    doc.fontSize(10).text(invoiceNumber, 50, 90);

    // Company info on right
    doc.fontSize(9).fillColor('#ffffff').text(company.address || 'Istanbul, Turkey', 400, 40, { align: 'right' });
    doc.text(company.phone || '+90 XXX XXX XXXX', 400, 55, { align: 'right' });
    doc.text(company.email || 'info@gnbtransfer.com', 400, 70, { align: 'right' });
    if (company.taxNumber) {
      doc.text(`Tax No: ${company.taxNumber}`, 400, 85, { align: 'right' });
    }

    // Reset position after header
    doc.moveDown(4);

    // Invoice details section
    doc.fillColor('#333333');
    doc.fontSize(10);

    // Date and booking info
    const leftCol = 50;
    const rightCol = 350;
    let yPos = 140;

    doc.font('Helvetica-Bold').text('Invoice Date:', leftCol, yPos);
    doc.font('Helvetica').text(new Date().toLocaleDateString('tr-TR'), leftCol + 100, yPos);

    doc.font('Helvetica-Bold').text('Booking Ref:', rightCol, yPos);
    doc.font('Helvetica').text(booking._id.toString().slice(-8).toUpperCase(), rightCol + 100, yPos);

    yPos += 20;
    doc.font('Helvetica-Bold').text('Service Date:', leftCol, yPos);
    doc.font('Helvetica').text(new Date(booking.date).toLocaleDateString('tr-TR'), leftCol + 100, yPos);

    doc.font('Helvetica-Bold').text('Status:', rightCol, yPos);
    doc.font('Helvetica').text(booking.status.toUpperCase(), rightCol + 100, yPos);

    // Customer details
    yPos += 40;
    doc.font('Helvetica-Bold').fontSize(12).text('CUSTOMER DETAILS / MÜŞTERİ BİLGİLERİ', leftCol, yPos);

    yPos += 20;
    doc.fontSize(10);
    doc.font('Helvetica-Bold').text('Name:', leftCol, yPos);
    doc.font('Helvetica').text(booking.name, leftCol + 80, yPos);

    yPos += 15;
    doc.font('Helvetica-Bold').text('Email:', leftCol, yPos);
    doc.font('Helvetica').text(booking.email, leftCol + 80, yPos);

    if (booking.phone) {
      yPos += 15;
      doc.font('Helvetica-Bold').text('Phone:', leftCol, yPos);
      doc.font('Helvetica').text(`${booking.phoneCountryCode || ''} ${booking.phone}`, leftCol + 80, yPos);
    }

    // Passenger names (Ministry compliance)
    if (booking.passengers && booking.passengers.length > 0) {
      yPos += 25;
      doc.font('Helvetica-Bold').fontSize(11).text('PASSENGERS / YOLCULAR', leftCol, yPos);
      yPos += 15;

      doc.fontSize(9);
      booking.passengers.forEach((passenger, index) => {
        doc.font('Helvetica').text(
          `${index + 1}. ${passenger.firstName} ${passenger.lastName} (${passenger.type})`,
          leftCol + 10,
          yPos
        );
        yPos += 12;
      });
    }

    // Service details table
    yPos += 20;
    doc.font('Helvetica-Bold').fontSize(12).text('SERVICE DETAILS / HİZMET DETAYLARI', leftCol, yPos);

    yPos += 20;

    // Table header
    doc.rect(leftCol, yPos, 495, 25).fill('#f3f4f6');
    doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold');
    doc.text('Description', leftCol + 10, yPos + 7);
    doc.text('Qty', 350, yPos + 7);
    doc.text('Price', 400, yPos + 7);
    doc.text('Total', 480, yPos + 7);

    yPos += 25;

    // Main service
    doc.font('Helvetica').fillColor('#333333');
    doc.text(booking.tour?.title || 'Airport Transfer', leftCol + 10, yPos + 7);
    doc.text('1', 350, yPos + 7);
    doc.text(`$${(booking.amount - (booking.extraServicesTotal || 0)).toFixed(2)}`, 400, yPos + 7);
    doc.text(`$${(booking.amount - (booking.extraServicesTotal || 0)).toFixed(2)}`, 480, yPos + 7);
    yPos += 25;

    // Extra services
    if (booking.extraServices) {
      const services = [
        { name: 'Child Seat', data: booking.extraServices.childSeat },
        { name: 'Baby Seat', data: booking.extraServices.babySeat },
        { name: 'Meet & Greet', data: booking.extraServices.meetAndGreet },
        { name: 'VIP Lounge', data: booking.extraServices.vipLounge },
      ];

      services.forEach((service) => {
        if (service.data?.selected) {
          const qty = service.data.quantity || 1;
          const price = service.data.price || 0;
          doc.text(service.name, leftCol + 10, yPos + 7);
          doc.text(qty.toString(), 350, yPos + 7);
          doc.text(`$${price.toFixed(2)}`, 400, yPos + 7);
          doc.text(`$${(qty * price).toFixed(2)}`, 480, yPos + 7);
          yPos += 25;
        }
      });
    }

    // Totals section
    yPos += 10;
    doc.moveTo(leftCol, yPos).lineTo(545, yPos).stroke('#e5e7eb');

    yPos += 15;
    const taxRate = settings.pricing.taxRate || 18;
    const subtotal = booking.amount / (1 + taxRate / 100);
    const tax = booking.amount - subtotal;

    doc.font('Helvetica').text('Subtotal:', 380, yPos);
    doc.text(`$${subtotal.toFixed(2)}`, 480, yPos);

    yPos += 15;
    doc.text(`VAT (${taxRate}%):`, 380, yPos);
    doc.text(`$${tax.toFixed(2)}`, 480, yPos);

    yPos += 20;
    doc.font('Helvetica-Bold').fontSize(12).text('TOTAL:', 380, yPos);
    doc.text(`$${booking.amount?.toFixed(2) || '0.00'}`, 480, yPos);

    // Payment info
    yPos += 40;
    doc.font('Helvetica-Bold').fontSize(11).text('PAYMENT INFORMATION / ÖDEME BİLGİSİ', leftCol, yPos);
    yPos += 15;
    doc.font('Helvetica').fontSize(10);
    doc.text(`Payment Method: ${booking.paymentMethod?.toUpperCase() || 'CASH'}`, leftCol, yPos);

    // Turkish e-fatura fields
    yPos += 30;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#666666');
    doc.text('E-FATURA BİLGİLERİ (Turkish E-Invoice Fields)', leftCol, yPos);
    yPos += 12;
    doc.font('Helvetica').fontSize(8);
    doc.text(`Fatura No: ${invoiceNumber}`, leftCol, yPos);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, leftCol + 150, yPos);
    doc.text(`ETTN: ${booking._id.toString()}`, leftCol + 300, yPos);

    // Footer
    const pageHeight = doc.page.height;
    doc.fontSize(8).fillColor('#999999').text(
      'This invoice was automatically generated by GNB Transfer booking system.',
      leftCol,
      pageHeight - 80,
      { align: 'center', width: 495 }
    );
    doc.text(
      'Bu fatura GNB Transfer rezervasyon sistemi tarafından otomatik olarak oluşturulmuştur.',
      leftCol,
      pageHeight - 65,
      { align: 'center', width: 495 }
    );

    // QR Code placeholder
    doc.rect(480, pageHeight - 100, 60, 60).stroke('#cccccc');
    doc.fontSize(6).fillColor('#666666').text('QR Code', 495, pageHeight - 35);

    doc.end();
  } catch (error) {
    logger.error('Error generating invoice:', { error: error.message });
    return res.apiError('Failed to generate invoice', 500);
  }
});

/**
 * @route   POST /api/invoices/bulk
 * @desc    Generate invoices for multiple bookings (returns ZIP)
 * @access  Private (admin only)
 */
router.post('/bulk', requireAuth(['admin']), async (req, res) => {
  try {
    const { bookingIds } = req.body;

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.apiError('bookingIds array is required', 400);
    }

    // For now, return links to individual invoices
    const invoiceLinks = bookingIds.map((id) => ({
      bookingId: id,
      invoiceUrl: `/api/invoices/${id}`,
    }));

    return res.apiSuccess({ invoices: invoiceLinks }, 'Invoice links generated');
  } catch (error) {
    logger.error('Error generating bulk invoices:', { error: error.message });
    return res.apiError('Failed to generate invoices', 500);
  }
});

/**
 * @route   GET /api/invoices/:bookingId/data
 * @desc    Get invoice data without PDF (for preview)
 * @access  Private (admin, manager, or booking owner)
 */
router.get('/:bookingId/data', requireAuth(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('tour', 'title price')
      .populate('user', 'name email');

    if (!booking) {
      return res.apiError('Booking not found', 404);
    }

    const isAdmin = ['admin', 'manager'].includes(req.user.role);
    const isOwner = booking.user?._id?.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.apiError('Not authorized', 403);
    }

    const settings = await Settings.getGlobalSettings();
    const taxRate = settings.pricing.taxRate || 18;
    const subtotal = booking.amount / (1 + taxRate / 100);
    const tax = booking.amount - subtotal;

    return res.apiSuccess({
      invoiceNumber: `INV-${booking._id.toString().slice(-8).toUpperCase()}`,
      booking: {
        id: booking._id,
        date: booking.date,
        status: booking.status,
        customer: {
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
        },
        passengers: booking.passengers,
        service: booking.tour?.title || 'Airport Transfer',
        amount: booking.amount,
        extraServicesTotal: booking.extraServicesTotal,
        paymentMethod: booking.paymentMethod,
      },
      company: settings.company,
      totals: {
        subtotal: Math.round(subtotal * 100) / 100,
        taxRate,
        tax: Math.round(tax * 100) / 100,
        total: booking.amount,
      },
    });
  } catch (error) {
    logger.error('Error fetching invoice data:', { error: error.message });
    return res.apiError('Failed to fetch invoice data', 500);
  }
});

export default router;
