/**
 * AI Service
 * Handles AI-powered features using GPT-3.5-Turbo and route APIs
 */

import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

const OPENROUTE_API_KEY = process.env.OPENROUTE_API_KEY || '';

/**
 * Calculate delay risk for a route using OpenRouteService API
 * This is a batch/static calculation to minimize API costs
 */
export async function calculateDelayRisk(origin, destination) {
  try {
    // Mock coordinates for demonstration (in production, geocode the locations)
    const mockOriginCoords = [28.9784, 41.0082]; // Istanbul example
    const mockDestCoords = [29.0000, 41.1000]; // Destination example

    // Use OpenRouteService for route calculation (free tier available)
    if (OPENROUTE_API_KEY) {
      const response = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        {
          coordinates: [mockOriginCoords, mockDestCoords]
        },
        {
          headers: {
            'Authorization': OPENROUTE_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      const route = response.data.routes[0];
      const distance = route.summary.distance / 1000; // km
      const duration = route.summary.duration / 60; // minutes

      // Simple risk calculation based on distance and time
      let riskScore = 0;
      
      // Longer routes have higher delay risk
      if (distance > 50) riskScore += 30;
      else if (distance > 30) riskScore += 20;
      else if (distance > 15) riskScore += 10;
      
      // Peak hours increase risk (simplified)
      const hour = new Date().getHours();
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        riskScore += 25;
      }

      // Weather and traffic would be factored in production
      riskScore += Math.floor(Math.random() * 15); // Random factor (0-15)

      return {
        distance,
        estimatedDuration: duration,
        delayRiskScore: Math.min(riskScore, 100),
        estimatedDelay: riskScore > 50 ? Math.floor(riskScore / 5) : 0
      };
    } else {
      // Fallback mock calculation when API key not available
      const mockDistance = 25 + Math.random() * 30;
      const mockDuration = mockDistance * 1.5;
      const mockRiskScore = Math.floor(Math.random() * 60);
      
      return {
        distance: mockDistance,
        estimatedDuration: mockDuration,
        delayRiskScore: mockRiskScore,
        estimatedDelay: mockRiskScore > 50 ? Math.floor(mockRiskScore / 5) : 0
      };
    }
  } catch (error) {
    console.error('Error calculating delay risk:', error.message);
    
    // Return safe defaults on error
    return {
      distance: 20,
      estimatedDuration: 30,
      delayRiskScore: 15,
      estimatedDelay: 0
    };
  }
}

/**
 * Generate discount code for delays > 15 minutes
 */
export function generateDiscountCode(delayMinutes) {
  if (delayMinutes <= 15) return null;
  
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DELAY${delayMinutes}-${timestamp}${random}`;
}

/**
 * Analyze user booking history and recommend smart packages
 * Uses GPT-3.5-Turbo for intelligent recommendations
 */
export async function generateSmartPackage(userId, userBookings, availableTours) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      // Fallback: Simple rule-based recommendation
      return generateFallbackPackage(userBookings, availableTours);
    }

    // Prepare booking history for AI analysis
    const bookingHistory = userBookings.map(b => ({
      tour: b.tour?.title || 'Unknown',
      amount: b.amount,
      date: b.createdAt
    }));

    const prompt = `You are a travel package recommendation expert. Based on the user's booking history, recommend a bundle of 1 transfer and 1 tour with a 15% discount.

User's booking history:
${JSON.stringify(bookingHistory, null, 2)}

Available tours:
${JSON.stringify(availableTours.map(t => ({ title: t.title, price: t.price, description: t.description })), null, 2)}

Respond with a JSON object containing:
{
  "recommendedTour": "tour title",
  "reasoning": "brief explanation why this tour fits the user",
  "bundlePrice": number,
  "discount": 15
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    });

    const responseText = completion.choices[0].message.content;
    
    // Parse JSON response
    try {
      const recommendation = JSON.parse(responseText);
      return {
        success: true,
        package: recommendation
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return generateFallbackPackage(userBookings, availableTours);
    }
  } catch (error) {
    console.error('Error generating smart package:', error.message);
    return generateFallbackPackage(userBookings, availableTours);
  }
}

/**
 * Fallback package recommendation using simple rules
 */
function generateFallbackPackage(userBookings, availableTours) {
  // Find most expensive tour the user hasn't booked
  const bookedTourIds = new Set(userBookings.map(b => b.tour?._id?.toString()));
  const unbookedTours = availableTours.filter(t => !bookedTourIds.has(t._id.toString()));
  
  let recommendedTour;
  if (unbookedTours.length > 0) {
    // Recommend most expensive unbooked tour
    recommendedTour = unbookedTours.sort((a, b) => b.price - a.price)[0];
  } else if (availableTours.length > 0) {
    // Recommend most expensive tour overall
    recommendedTour = availableTours.sort((a, b) => b.price - a.price)[0];
  } else {
    return {
      success: false,
      error: 'No tours available'
    };
  }

  const basePrice = recommendedTour.price;
  const discountedPrice = basePrice * 0.85; // 15% discount

  return {
    success: true,
    package: {
      recommendedTour: recommendedTour.title,
      reasoning: 'Based on your booking history and preferences, this tour offers great value and new experiences.',
      bundlePrice: discountedPrice,
      discount: 15,
      tourId: recommendedTour._id
    }
  };
}

export default {
  calculateDelayRisk,
  generateDiscountCode,
  generateSmartPackage
};
