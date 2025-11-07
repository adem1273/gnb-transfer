/**
 * Chat routes - AI-powered LiveChat assistant
 *
 * @module routes/chatRoutes
 */

import express from 'express';
import SupportTicket from '../models/SupportTicket.mjs';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import { optionalAuth } from '../middlewares/auth.mjs';
import {
  generateAIResponse,
  classifyIntent,
  getRecommendedTours,
  generateUpsellSuggestions,
  translateText,
} from '../services/aiChatService.mjs';

const router = express.Router();

/**
 * @route   POST /api/chat/message
 * @desc    Send a message to the AI assistant
 * @access  Public (rate limited)
 * @body    {string} message - User's message
 * @body    {string} [language=en] - User's preferred language
 * @body    {string} [mode=question] - Interaction mode: 'question' or 'booking'
 * @body    {array} [conversationHistory] - Previous conversation messages
 * @body    {string} [bookingId] - Booking ID for booking management mode
 * @returns {object} - AI response with suggested actions
 */
router.post('/message', strictRateLimiter, optionalAuth, async (req, res) => {
  try {
    const { message, language = 'en', mode = 'question', conversationHistory = [], bookingId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.apiError('Message is required', 400);
    }

    if (message.length > 1000) {
      return res.apiError('Message too long (max 1000 characters)', 400);
    }

    // Build context
    const context = {
      conversationHistory: conversationHistory.slice(-10), // Keep last 10 messages
    };

    // If user is authenticated, add their booking information
    if (req.user) {
      const userBookings = await Booking.find({ 
        email: req.user.email 
      }).populate('tour', 'title price').limit(5).lean();
      context.userBookings = userBookings;
    }

    // If booking mode and bookingId provided, fetch booking details
    let booking = null;
    if (mode === 'booking' && bookingId) {
      booking = await Booking.findById(bookingId).populate('tour').lean();
      if (booking) {
        context.booking = booking;
      }
    }

    // Get available tours for recommendations
    const tours = await Tour.find({ isActive: true }).limit(10).lean();
    context.availableTours = tours;

    // Classify user intent
    const { intent } = await classifyIntent(message, language);

    // Generate AI response
    const aiResult = await generateAIResponse(message, language, context);

    if (!aiResult.success) {
      // AI failed, create support ticket
      const ticket = await SupportTicket.create({
        name: req.user?.name || 'Anonymous',
        email: req.user?.email || 'support@gnbtransfer.com',
        subject: 'AI Chat Assistance Needed',
        message: message,
        category: intent === 'booking' ? 'booking' : 'general',
        aiAttempted: true,
        aiResponse: null,
        language,
        user: req.user?.id || null,
        conversationHistory: [
          ...conversationHistory,
          { role: 'user', content: message, timestamp: new Date() },
        ],
      });

      return res.apiSuccess(
        {
          message: language === 'tr' 
            ? 'Üzgünüm, şu anda yardımcı olamıyorum. Destek ekibimiz sizinle iletişime geçecek.'
            : 'Sorry, I cannot assist right now. Our support team will contact you.',
          needsHumanSupport: true,
          ticketId: ticket._id,
          intent,
        },
        'Support ticket created'
      );
    }

    // Get recommendations if relevant
    let recommendations = [];
    if (intent === 'tour_info' || message.toLowerCase().includes('tour')) {
      recommendations = await getRecommendedTours(message, language);
    }

    // Get upsell suggestions if in booking context
    let upsells = [];
    if (booking) {
      upsells = await generateUpsellSuggestions(booking, language);
    }

    // Track conversation for analytics
    const response = {
      message: aiResult.message,
      intent,
      recommendations: recommendations.map(t => ({
        id: t._id,
        title: t.title,
        price: t.price,
        duration: t.duration,
        discount: t.discount,
      })),
      upsells,
      needsHumanSupport: false,
    };

    return res.apiSuccess(response, 'AI response generated');
  } catch (error) {
    console.error('Chat message error:', error);
    return res.apiError(`Chat error: ${error.message}`, 500);
  }
});

/**
 * @route   POST /api/chat/booking/manage
 * @desc    Manage booking through chat (check status, modify, cancel)
 * @access  Public (rate limited)
 * @body    {string} bookingId - Booking ID
 * @body    {string} email - Email associated with booking
 * @body    {string} action - Action to perform: 'check', 'modify', 'cancel'
 * @body    {string} [language=en] - User's preferred language
 * @returns {object} - Booking information and available actions
 */
router.post('/booking/manage', strictRateLimiter, async (req, res) => {
  try {
    const { bookingId, email, action, language = 'en' } = req.body;

    if (!bookingId || !email) {
      return res.apiError('Booking ID and email are required', 400);
    }

    // Find booking
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      email: email.toLowerCase() 
    }).populate('tour').lean();

    if (!booking) {
      return res.apiError(
        language === 'tr' ? 'Rezervasyon bulunamadı' : 'Booking not found',
        404
      );
    }

    let responseMessage = '';
    let updatedBooking = booking;

    switch (action) {
      case 'check':
        responseMessage = language === 'tr'
          ? `Rezervasyonunuz: ${booking.tour?.title}. Durum: ${booking.status}. Tutar: ${booking.amount}€`
          : `Your booking: ${booking.tour?.title}. Status: ${booking.status}. Amount: ${booking.amount}€`;
        break;

      case 'cancel':
        if (booking.status === 'cancelled') {
          return res.apiError(
            language === 'tr' ? 'Rezervasyon zaten iptal edildi' : 'Booking already cancelled',
            400
          );
        }
        
        updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { status: 'cancelled' },
          { new: true }
        ).populate('tour').lean();

        responseMessage = language === 'tr'
          ? 'Rezervasyonunuz iptal edildi. Ödeme yaptıysanız, 5-7 iş günü içinde iade edilecektir.'
          : 'Your booking has been cancelled. If paid, refund will be processed in 5-7 business days.';
        break;

      case 'modify':
        responseMessage = language === 'tr'
          ? 'Rezervasyonunuzu değiştirmek için lütfen destek ekibimizle iletişime geçin.'
          : 'To modify your booking, please contact our support team.';
        break;

      default:
        return res.apiError('Invalid action', 400);
    }

    // Get upsell suggestions
    const upsells = await generateUpsellSuggestions(updatedBooking, language);

    return res.apiSuccess({
      message: responseMessage,
      booking: {
        id: updatedBooking._id,
        tourTitle: updatedBooking.tour?.title,
        status: updatedBooking.status,
        amount: updatedBooking.amount,
        date: updatedBooking.date,
        guests: updatedBooking.guests,
      },
      upsells,
    }, 'Booking action completed');
  } catch (error) {
    console.error('Booking management error:', error);
    return res.apiError(`Booking management error: ${error.message}`, 500);
  }
});

/**
 * @route   POST /api/chat/support-ticket
 * @desc    Create a support ticket when AI cannot help
 * @access  Public (rate limited)
 * @body    {string} name - Customer name
 * @body    {string} email - Customer email
 * @body    {string} subject - Ticket subject
 * @body    {string} message - Ticket message
 * @body    {string} [language=en] - User's preferred language
 * @body    {string} [category=general] - Ticket category
 * @body    {array} [conversationHistory] - Chat history
 * @returns {object} - Created support ticket
 */
router.post('/support-ticket', strictRateLimiter, async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      message,
      language = 'en',
      category = 'general',
      conversationHistory = [],
    } = req.body;

    if (!name || !email || !subject || !message) {
      return res.apiError('All fields are required', 400);
    }

    const ticket = await SupportTicket.create({
      name,
      email,
      subject,
      message,
      category,
      language,
      aiAttempted: true,
      conversationHistory: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date(),
      })),
    });

    const responseMessage = language === 'tr'
      ? 'Destek talebiniz oluşturuldu. Ekibimiz en kısa sürede sizinle iletişime geçecek.'
      : 'Support ticket created. Our team will contact you shortly.';

    return res.apiSuccess(
      {
        ticketId: ticket._id,
        message: responseMessage,
      },
      'Support ticket created',
      201
    );
  } catch (error) {
    console.error('Support ticket creation error:', error);
    return res.apiError(`Failed to create support ticket: ${error.message}`, 500);
  }
});

/**
 * @route   POST /api/chat/translate
 * @desc    Translate text to target language (fallback for missing i18n keys)
 * @access  Public (rate limited)
 * @body    {string} text - Text to translate
 * @body    {string} targetLanguage - Target language code
 * @returns {object} - Translated text
 */
router.post('/translate', strictRateLimiter, async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.apiError('Text and target language are required', 400);
    }

    const translated = await translateText(text, targetLanguage);

    return res.apiSuccess({ translated }, 'Translation completed');
  } catch (error) {
    console.error('Translation error:', error);
    return res.apiError(`Translation error: ${error.message}`, 500);
  }
});

/**
 * @route   POST /api/chat/log-upsell
 * @desc    Log upsell conversion for analytics
 * @access  Public (rate limited)
 * @body    {string} bookingId - Original booking ID
 * @body    {string} upsellTourId - Upsold tour ID
 * @body    {string} upsellType - Type of upsell (tour, vip, etc.)
 * @returns {object} - Success confirmation
 */
router.post('/log-upsell', strictRateLimiter, async (req, res) => {
  try {
    const { bookingId, upsellTourId, upsellType } = req.body;

    if (!bookingId || !upsellTourId) {
      return res.apiError('Booking ID and upsell tour ID are required', 400);
    }

    // Update booking with upsell information
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $push: {
          upsells: {
            tourId: upsellTourId,
            type: upsellType || 'tour',
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!booking) {
      return res.apiError('Booking not found', 404);
    }

    // Log for analytics (could be expanded to separate analytics service)
    console.log('Upsell conversion:', {
      bookingId,
      upsellTourId,
      upsellType,
      timestamp: new Date(),
    });

    return res.apiSuccess({ logged: true }, 'Upsell logged successfully');
  } catch (error) {
    console.error('Upsell logging error:', error);
    return res.apiError(`Failed to log upsell: ${error.message}`, 500);
  }
});

export default router;
