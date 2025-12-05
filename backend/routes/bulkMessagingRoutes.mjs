/**
 * Bulk Messaging Routes
 *
 * @module routes/bulkMessagingRoutes
 * @description Endpoints for bulk WhatsApp and email messaging
 */

import express from 'express';
import Booking from '../models/Booking.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { sendEmail } from '../services/emailService.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

// Message templates
const MESSAGE_TEMPLATES = {
  reminder: {
    subject: 'Booking Reminder - GNB Transfer',
    content: 'Dear {name}, this is a reminder for your upcoming transfer on {date} at {time}. Your driver will pick you up at {pickup}. Booking reference: {bookingId}',
  },
  confirmation: {
    subject: 'Booking Confirmed - GNB Transfer',
    content: 'Dear {name}, your booking has been confirmed! Date: {date}, Pickup: {pickup}. Thank you for choosing GNB Transfer.',
  },
  promotion: {
    subject: 'Special Offer from GNB Transfer',
    content: 'Dear {name}, we have a special offer for you! Use code {code} for {discount}% off your next booking.',
  },
  review_request: {
    subject: 'How was your trip? - GNB Transfer',
    content: 'Dear {name}, thank you for traveling with us! We would love to hear your feedback. Please take a moment to rate your experience.',
  },
  custom: {
    subject: '',
    content: '',
  },
};

/**
 * @route   GET /api/admin/messaging/templates
 * @desc    Get available message templates
 * @access  Private (admin, manager)
 */
router.get('/templates', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const templates = Object.entries(MESSAGE_TEMPLATES).map(([key, value]) => ({
      id: key,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      subject: value.subject,
      content: value.content,
    }));

    return res.apiSuccess({ templates });
  } catch (error) {
    logger.error('Error fetching templates:', { error: error.message });
    return res.apiError('Failed to fetch templates', 500);
  }
});

/**
 * @route   POST /api/admin/messaging/preview
 * @desc    Preview message with template variables replaced
 * @access  Private (admin, manager)
 */
router.post('/preview', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { templateId, customSubject, customContent, bookingId } = req.body;

    const template = MESSAGE_TEMPLATES[templateId] || MESSAGE_TEMPLATES.custom;
    let subject = customSubject || template.subject;
    let content = customContent || template.content;

    // If bookingId provided, replace placeholders with actual data
    if (bookingId) {
      const booking = await Booking.findById(bookingId).populate('tour', 'title');

      if (booking) {
        const replacements = {
          '{name}': booking.name,
          '{date}': new Date(booking.date).toLocaleDateString(),
          '{time}': booking.time || 'TBD',
          '{pickup}': booking.pickupLocation || 'TBD',
          '{bookingId}': booking._id.toString().slice(-8).toUpperCase(),
          '{tour}': booking.tour?.title || 'Transfer',
          '{amount}': `$${booking.amount || 0}`,
        };

        for (const [key, value] of Object.entries(replacements)) {
          subject = subject.replace(new RegExp(key, 'g'), value);
          content = content.replace(new RegExp(key, 'g'), value);
        }
      }
    }

    return res.apiSuccess({ subject, content });
  } catch (error) {
    logger.error('Error previewing message:', { error: error.message });
    return res.apiError('Failed to preview message', 500);
  }
});

/**
 * @route   POST /api/admin/messaging/send-email
 * @desc    Send bulk email to selected bookings
 * @access  Private (admin only)
 */
router.post('/send-email', requireAuth(['admin']), async (req, res) => {
  try {
    const { bookingIds, templateId, customSubject, customContent, variables } = req.body;

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.apiError('bookingIds array is required', 400);
    }

    const template = MESSAGE_TEMPLATES[templateId] || MESSAGE_TEMPLATES.custom;
    const baseSubject = customSubject || template.subject;
    const baseContent = customContent || template.content;

    if (!baseSubject || !baseContent) {
      return res.apiError('Subject and content are required', 400);
    }

    const bookings = await Booking.find({ _id: { $in: bookingIds } }).populate('tour', 'title');

    const results = {
      sent: 0,
      failed: 0,
      errors: [],
    };

    for (const booking of bookings) {
      try {
        let subject = baseSubject;
        let content = baseContent;

        // Replace placeholders
        const replacements = {
          '{name}': booking.name,
          '{email}': booking.email,
          '{date}': new Date(booking.date).toLocaleDateString(),
          '{time}': booking.time || 'TBD',
          '{pickup}': booking.pickupLocation || 'TBD',
          '{bookingId}': booking._id.toString().slice(-8).toUpperCase(),
          '{tour}': booking.tour?.title || 'Transfer',
          '{amount}': `$${booking.amount || 0}`,
          ...(variables || {}),
        };

        for (const [key, value] of Object.entries(replacements)) {
          // Escape all special regex characters in the key to prevent ReDoS
          const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          subject = subject.replace(new RegExp(escapedKey, 'g'), String(value));
          content = content.replace(new RegExp(escapedKey, 'g'), String(value));
        }

        // Send email
        await sendEmail({
          to: booking.email,
          subject,
          text: content,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">GNB Transfer</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              ${content.replace(/\n/g, '<br>')}
            </div>
            <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>GNB Transfer - Premium Airport Transfer Services</p>
            </div>
          </div>`,
        });

        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          bookingId: booking._id,
          email: booking.email,
          error: err.message,
        });
      }
    }

    logger.info('Bulk email sent', { sentBy: req.user.id, sent: results.sent, failed: results.failed });

    return res.apiSuccess(results, `Emails sent: ${results.sent}, Failed: ${results.failed}`);
  } catch (error) {
    logger.error('Error sending bulk email:', { error: error.message });
    return res.apiError('Failed to send emails', 500);
  }
});

/**
 * @route   POST /api/admin/messaging/generate-whatsapp
 * @desc    Generate WhatsApp message links for selected bookings
 * @access  Private (admin, manager)
 */
router.post('/generate-whatsapp', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { bookingIds, message, variables } = req.body;

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.apiError('bookingIds array is required', 400);
    }

    if (!message) {
      return res.apiError('message is required', 400);
    }

    const bookings = await Booking.find({ _id: { $in: bookingIds } }).populate('tour', 'title');

    const results = [];

    for (const booking of bookings) {
      if (!booking.phone && !booking.whatsappLink) {
        results.push({
          bookingId: booking._id,
          name: booking.name,
          error: 'No phone number',
        });
        continue;
      }

      let personalizedMessage = message;

      // Replace placeholders
      const replacements = {
        '{name}': booking.name,
        '{date}': new Date(booking.date).toLocaleDateString(),
        '{time}': booking.time || 'TBD',
        '{pickup}': booking.pickupLocation || 'TBD',
        '{bookingId}': booking._id.toString().slice(-8).toUpperCase(),
        '{tour}': booking.tour?.title || 'Transfer',
        '{amount}': `$${booking.amount || 0}`,
        ...(variables || {}),
      };

      for (const [key, value] of Object.entries(replacements)) {
        // Escape all special regex characters in the key to prevent ReDoS
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        personalizedMessage = personalizedMessage.replace(
          new RegExp(escapedKey, 'g'),
          String(value)
        );
      }

      // Generate WhatsApp link
      const phoneNumber = booking.whatsappLink
        ? booking.whatsappLink.replace('https://wa.me/', '')
        : `${booking.phoneCountryCode || ''}${booking.phone}`.replace(/\D/g, '');

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(personalizedMessage)}`;

      results.push({
        bookingId: booking._id,
        name: booking.name,
        phone: booking.phone,
        whatsappUrl,
        message: personalizedMessage,
      });
    }

    return res.apiSuccess({ results }, `Generated ${results.length} WhatsApp links`);
  } catch (error) {
    logger.error('Error generating WhatsApp links:', { error: error.message });
    return res.apiError('Failed to generate links', 500);
  }
});

/**
 * @route   GET /api/admin/messaging/history
 * @desc    Get message sending history
 * @access  Private (admin)
 */
router.get('/history', requireAuth(['admin']), async (req, res) => {
  try {
    // This would typically come from a MessageLog model
    // For now, return empty array as placeholder
    return res.apiSuccess({
      history: [],
      message: 'Message history tracking not yet implemented',
    });
  } catch (error) {
    logger.error('Error fetching message history:', { error: error.message });
    return res.apiError('Failed to fetch history', 500);
  }
});

export default router;
