/**
 * FAQ Bot Service
 *
 * @module services/faqBotService
 * @description Lightweight AI-like FAQ bot using keyword matching
 */

import logger from '../config/logger.mjs';

/**
 * FAQ Knowledge Base
 * Organized by category with keywords and responses
 */
const FAQ_DATABASE = {
  booking: {
    keywords: ['book', 'booking', 'reserve', 'reservation', 'how to book', 'make booking'],
    questions: [
      {
        patterns: ['how', 'book', 'tour'],
        answer:
          'To book a tour, browse our tours page, select your preferred tour, choose a date, and click "Book Now". You\'ll be guided through the payment process. You can pay with credit card or cash.',
      },
      {
        patterns: ['cancel', 'cancellation', 'refund'],
        answer:
          'We offer free cancellation up to 24 hours before the tour starts. To cancel, go to your bookings page and click "Cancel Booking". Refunds are processed within 5-7 business days.',
      },
      {
        patterns: ['change', 'modify', 'reschedule'],
        answer:
          'You can modify your booking up to 24 hours before the tour. Visit your bookings page, select the booking, and click "Modify". Some changes may incur additional fees.',
      },
    ],
  },
  payment: {
    keywords: ['pay', 'payment', 'price', 'cost', 'credit card', 'cash'],
    questions: [
      {
        patterns: ['payment', 'method', 'how', 'pay'],
        answer:
          'We accept credit/debit cards (Visa, MasterCard, American Express) and cash payments. Online payments are processed securely through Stripe.',
      },
      {
        patterns: ['price', 'cost', 'how much'],
        answer:
          'Tour prices vary by destination and type. You can see all prices on our tours page. Prices include transportation and guide services. Some tours offer group discounts.',
      },
      {
        patterns: ['discount', 'coupon', 'promo'],
        answer:
          'We regularly offer discounts and promotional codes. Check our campaigns page or subscribe to our newsletter for special offers. You can apply coupon codes at checkout.',
      },
    ],
  },
  tours: {
    keywords: ['tour', 'destination', 'location', 'where', 'trip', 'excursion'],
    questions: [
      {
        patterns: ['available', 'tours', 'destinations'],
        answer:
          'We offer tours to various destinations including historical sites, beaches, mountains, and city tours. Visit our tours page to see the full list with descriptions and prices.',
      },
      {
        patterns: ['duration', 'how long', 'time'],
        answer:
          'Tour durations vary from half-day (4 hours) to full-day (8-10 hours) excursions. Each tour listing shows the exact duration and schedule.',
      },
      {
        patterns: ['include', 'included', 'what'],
        answer:
          'Most tours include transportation, professional guide, and entrance fees. Meals and personal expenses are usually not included unless specified in the tour description.',
      },
    ],
  },
  account: {
    keywords: ['account', 'profile', 'login', 'register', 'password', 'sign up'],
    questions: [
      {
        patterns: ['create', 'account', 'register'],
        answer:
          'To create an account, click "Register" in the top menu, fill in your details, and verify your email. Having an account allows you to track bookings and get personalized recommendations.',
      },
      {
        patterns: ['forgot', 'password', 'reset'],
        answer:
          'If you forgot your password, click "Forgot Password" on the login page. Enter your email and we\'ll send you a reset link. The link is valid for 24 hours.',
      },
      {
        patterns: ['update', 'profile', 'information'],
        answer:
          'You can update your profile information by logging in and visiting your account settings. You can change your name, email, phone number, and preferences.',
      },
    ],
  },
  general: {
    keywords: ['contact', 'support', 'help', 'customer service', 'email', 'phone'],
    questions: [
      {
        patterns: ['contact', 'reach', 'support'],
        answer:
          'You can contact us through our contact page, email us at support@gnbtransfer.com, or call +90 XXX XXX XXXX. Our customer support is available 24/7.',
      },
      {
        patterns: ['language', 'languages'],
        answer:
          'Our website supports 8 languages: English, Arabic, German, Spanish, Italian, Russian, Chinese, and Hindi. You can change the language using the language selector in the header.',
      },
      {
        patterns: ['safe', 'safety', 'secure'],
        answer:
          'Your safety is our priority. All our drivers are licensed professionals, vehicles are regularly maintained, and we track all tours in real-time. Payments are processed securely through encrypted connections.',
      },
    ],
  },
};

/**
 * Calculate similarity between two strings using keyword matching
 */
const calculateSimilarity = (text1, text2) => {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  let matches = 0;
  words1.forEach((word1) => {
    if (words2.some((word2) => word2.includes(word1) || word1.includes(word2))) {
      matches++;
    }
  });

  return matches / Math.max(words1.length, words2.length);
};

/**
 * Find best matching FAQ answer for a user query
 *
 * @param {string} query - User's question
 * @returns {Object} - Best matching answer with confidence score
 */
export const findAnswer = (query) => {
  try {
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        answer: 'Please ask a question about our services.',
        confidence: 0,
      };
    }

    const queryLower = query.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
    let category = null;

    // Check each category
    Object.entries(FAQ_DATABASE).forEach(([categoryName, categoryData]) => {
      // Check if query contains category keywords
      const categoryScore = categoryData.keywords.some((keyword) => queryLower.includes(keyword))
        ? 0.3
        : 0;

      // Check each question in category
      categoryData.questions.forEach((question) => {
        // Calculate how many patterns match
        const patternMatches = question.patterns.filter((pattern) =>
          queryLower.includes(pattern)
        ).length;

        const score = categoryScore + patternMatches / question.patterns.length;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = question.answer;
          category = categoryName;
        }
      });
    });

    // If no good match found, provide default response
    if (bestScore < 0.3) {
      return {
        success: false,
        answer:
          "I'm not sure I understood your question. Could you please rephrase it or contact our support team for personalized assistance?",
        confidence: 0,
        suggestion: 'Try asking about bookings, payments, tours, or your account.',
      };
    }

    return {
      success: true,
      answer: bestMatch,
      confidence: Math.min(bestScore, 1),
      category,
      relatedTopics: FAQ_DATABASE[category].keywords.slice(0, 3),
    };
  } catch (error) {
    logger.error('FAQ bot error:', { error: error.message, query });
    return {
      success: false,
      answer: 'Sorry, I encountered an error. Please try again or contact support.',
      confidence: 0,
    };
  }
};

/**
 * Get FAQ suggestions based on category
 *
 * @param {string} category - Category name
 * @returns {Array} - Array of sample questions
 */
export const getFAQSuggestions = (category = null) => {
  if (category && FAQ_DATABASE[category]) {
    return FAQ_DATABASE[category].questions.map((q) => ({
      question: q.patterns.slice(0, 3).join(' '),
      answer: `${q.answer.substring(0, 100)}...`,
    }));
  }

  // Return suggestions from all categories
  const suggestions = [];
  Object.entries(FAQ_DATABASE).forEach(([catName, catData]) => {
    if (catData.questions.length > 0) {
      const question = catData.questions[0];
      suggestions.push({
        category: catName,
        question: question.patterns.slice(0, 3).join(' '),
        answer: `${question.answer.substring(0, 100)}...`,
      });
    }
  });

  return suggestions;
};

/**
 * Get all FAQ categories
 *
 * @returns {Array} - Array of category names with descriptions
 */
export const getCategories = () =>
  Object.keys(FAQ_DATABASE).map((category) => ({
    name: category,
    keywords: FAQ_DATABASE[category].keywords,
    questionCount: FAQ_DATABASE[category].questions.length,
  }));

export default {
  findAnswer,
  getFAQSuggestions,
  getCategories,
};
