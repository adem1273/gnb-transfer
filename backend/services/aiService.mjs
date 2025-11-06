/**
 * AI Service for Smart Package Creation
 * Uses GPT-3.5-Turbo for intelligent package recommendations
 */

import OpenAI from 'openai';
import User from '../models/User.mjs';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Warn if OpenAI API key is not configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY not set. AI features will use fallback logic.');
}

/**
 * Get user booking history with tour details
 */
async function getUserBookingHistory(userId) {
  try {
    const bookings = await Booking.find({ user: userId })
      .populate('tour')
      .sort({ createdAt: -1 })
      .limit(10); // Last 10 bookings
    
    return bookings.map(booking => ({
      tourTitle: booking.tour?.title || 'Unknown',
      tourPrice: booking.tour?.price || 0,
      amount: booking.amount,
      status: booking.status,
      date: booking.createdAt
    }));
  } catch (error) {
    console.error('Error fetching user booking history:', error);
    return [];
  }
}

/**
 * Analyze user preferences using GPT-3.5-Turbo
 */
async function analyzeUserPreferences(bookingHistory) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set. Using fallback analysis.');
    return fallbackAnalysis(bookingHistory);
  }
  
  try {
    const bookingsSummary = bookingHistory.length > 0
      ? bookingHistory.map(b => `- ${b.tourTitle} ($${b.tourPrice})`).join('\n')
      : 'No previous bookings';
    
    const prompt = `Analyze the following customer booking history and suggest tour preferences:
    
Booking History:
${bookingsSummary}

Based on this history, identify:
1. Price range preference (budget/mid-range/premium)
2. Tour type preferences (cultural/adventure/relaxation/sightseeing)
3. Recommended tour categories

Respond in JSON format:
{
  "priceRange": "budget|mid-range|premium",
  "preferredTypes": ["type1", "type2"],
  "recommendedCategories": ["category1", "category2"],
  "reasoning": "brief explanation"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an AI travel advisor analyzing customer preferences from their booking history.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    return analysis;
  } catch (error) {
    console.error('Error analyzing user preferences with GPT:', error);
    return fallbackAnalysis(bookingHistory);
  }
}

/**
 * Fallback analysis when OpenAI is unavailable
 */
function fallbackAnalysis(bookingHistory) {
  if (bookingHistory.length === 0) {
    return {
      priceRange: 'mid-range',
      preferredTypes: ['sightseeing', 'cultural'],
      recommendedCategories: ['popular', 'family-friendly'],
      reasoning: 'New customer - suggesting popular mid-range options'
    };
  }
  
  const avgPrice = bookingHistory.reduce((sum, b) => sum + b.tourPrice, 0) / bookingHistory.length;
  
  let priceRange = 'mid-range';
  if (avgPrice < 50) priceRange = 'budget';
  else if (avgPrice > 150) priceRange = 'premium';
  
  return {
    priceRange,
    preferredTypes: ['sightseeing', 'cultural'],
    recommendedCategories: ['recommended', 'popular'],
    reasoning: `Based on average spending of $${avgPrice.toFixed(2)}`
  };
}

/**
 * Find matching tours based on user preferences
 */
async function findMatchingTours(preferences, currentTourId = null, limit = 3) {
  try {
    // Build query based on preferences
    const query = {};
    
    // Exclude current tour if provided
    if (currentTourId) {
      query._id = { $ne: currentTourId };
    }
    
    // Filter by price range
    if (preferences.priceRange === 'budget') {
      query.price = { $lte: 100 };
    } else if (preferences.priceRange === 'mid-range') {
      query.price = { $gte: 50, $lte: 200 };
    } else if (preferences.priceRange === 'premium') {
      query.price = { $gte: 150 };
    }
    
    // Get available tours
    const tours = await Tour.find(query)
      .sort({ price: -1 }) // Sort by price descending
      .limit(limit * 2); // Get more than needed for better selection
    
    // If not enough tours, get any available tours
    if (tours.length < limit) {
      const additionalTours = await Tour.find({
        _id: { $nin: [...tours.map(t => t._id), currentTourId].filter(Boolean) }
      }).limit(limit - tours.length);
      
      tours.push(...additionalTours);
    }
    
    return tours.slice(0, limit);
  } catch (error) {
    console.error('Error finding matching tours:', error);
    return [];
  }
}

/**
 * Calculate package discount
 * Always 15% discount for bundled packages
 */
function calculatePackageDiscount(tours) {
  const totalPrice = tours.reduce((sum, tour) => sum + tour.price, 0);
  const discountPercentage = 15;
  const discountAmount = totalPrice * (discountPercentage / 100);
  const finalPrice = totalPrice - discountAmount;
  
  return {
    originalPrice: totalPrice,
    discountPercentage,
    discountAmount,
    finalPrice
  };
}

/**
 * Generate package recommendation using GPT-3.5-Turbo
 */
async function generatePackageDescription(tours, userPreferences) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      title: 'Recommended Package for You',
      description: `We've curated this special package based on your preferences. Enjoy ${tours.length} amazing experiences with an exclusive 15% discount!`,
      highlights: tours.map(t => t.title)
    };
  }
  
  try {
    const toursList = tours.map(t => `- ${t.title} ($${t.price})`).join('\n');
    
    const prompt = `Create an engaging package description for a travel bundle:

Tours in Package:
${toursList}

User Preferences: ${userPreferences.reasoning}

Generate:
1. A catchy package title (max 60 chars)
2. A compelling description (2-3 sentences)
3. 3 key highlights

Respond in JSON format:
{
  "title": "package title",
  "description": "package description",
  "highlights": ["highlight1", "highlight2", "highlight3"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a travel marketing expert creating compelling package descriptions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 250,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error generating package description:', error);
    return {
      title: 'Personalized Package Deal',
      description: `Experience the best of Turkey with this carefully selected package. Save 15% when you book these ${tours.length} tours together!`,
      highlights: tours.map(t => t.title).slice(0, 3)
    };
  }
}

/**
 * Create smart package recommendation
 * Main function that orchestrates the package creation
 */
export async function createSmartPackage(userId, currentTourId = null) {
  try {
    // Step 1: Get user booking history
    const bookingHistory = await getUserBookingHistory(userId);
    
    // Step 2: Analyze user preferences with AI
    const preferences = await analyzeUserPreferences(bookingHistory);
    
    // Step 3: Find matching tours
    const recommendedTours = await findMatchingTours(preferences, currentTourId, 3);
    
    if (recommendedTours.length === 0) {
      throw new Error('No tours available for package creation');
    }
    
    // Step 4: Calculate package discount
    const pricing = calculatePackageDiscount(recommendedTours);
    
    // Step 5: Generate package description with AI
    const packageInfo = await generatePackageDescription(recommendedTours, preferences);
    
    // Step 6: Return complete package
    return {
      success: true,
      package: {
        title: packageInfo.title,
        description: packageInfo.description,
        highlights: packageInfo.highlights,
        tours: recommendedTours.map(tour => ({
          id: tour._id,
          title: tour.title,
          description: tour.description,
          price: tour.price
        })),
        pricing: {
          originalPrice: pricing.originalPrice,
          discountPercentage: pricing.discountPercentage,
          discountAmount: pricing.discountAmount,
          finalPrice: pricing.finalPrice
        },
        userPreferences: preferences
      }
    };
  } catch (error) {
    console.error('Error creating smart package:', error);
    throw error;
  }
}

/**
 * Simple package recommendation without user history
 * For new users or when user is not authenticated
 */
export async function createGenericPackage(currentTourId = null) {
  try {
    // Get popular tours
    const tours = await Tour.find(
      currentTourId ? { _id: { $ne: currentTourId } } : {}
    )
      .sort({ price: -1 })
      .limit(3);
    
    if (tours.length === 0) {
      throw new Error('No tours available');
    }
    
    const pricing = calculatePackageDiscount(tours);
    
    return {
      success: true,
      package: {
        title: 'Popular Tour Package',
        description: 'Discover Turkey\'s most loved destinations with this specially curated package. Save 15% when you book now!',
        highlights: [
          'Best value for money',
          'Most popular tours',
          'Flexible scheduling'
        ],
        tours: tours.map(tour => ({
          id: tour._id,
          title: tour.title,
          description: tour.description,
          price: tour.price
        })),
        pricing: {
          originalPrice: pricing.originalPrice,
          discountPercentage: pricing.discountPercentage,
          discountAmount: pricing.discountAmount,
          finalPrice: pricing.finalPrice
        }
      }
    };
  } catch (error) {
    console.error('Error creating generic package:', error);
    throw error;
  }
}

export default {
  createSmartPackage,
  createGenericPackage,
  analyzeUserPreferences,
  generatePackageDescription
};
