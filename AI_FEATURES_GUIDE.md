# AI Features Implementation Guide

## Overview
This document describes the implementation of two core AI features for GNB Transfer:
1. **Delay Guarantee System** - Provides transparency and trust through delay risk calculation
2. **Smart Package Creator** - Increases AOV through AI-powered bundle recommendations

## Features Implemented

### 1. Delay Guarantee System

#### Backend Components

**Model: `DelayMetrics.mjs`**
- Stores delay risk calculations for each booking
- Fields: booking reference, route details, risk score, estimated delay, discount code
- Indexes optimized for booking queries

**Service: `aiService.mjs - calculateDelayRisk()`**
- Calculates delay risk using OpenRouteService API
- Factors: distance, time of day (peak hours), route complexity
- Fallback to mock calculation when API unavailable
- Returns risk score (0-100) and estimated delay minutes

**Controller: `delayController.mjs`**
- `POST /api/delay/calculate` - Calculate delay for a booking
- `GET /api/delay/:bookingId` - Get delay metrics for a booking
- `GET /api/delay/all` - Get all delay metrics (admin only)

**Discount Code Generation**
- Automatic generation when delay > 15 minutes
- Format: `DELAY{minutes}-{timestamp}{random}`
- Example: `DELAY20-M8K9A7C3F2`

#### Frontend Components

**Component: `DelayBadge.jsx`**
- Visual display of delay guarantee
- Color-coded risk levels (green/yellow/red)
- Shows risk score out of 100
- Displays estimated delay time
- Shows earned discount code with copy button
- Informational tooltip about guarantee

**Integration: `Booking.jsx`**
- Calculates delay after successful cash booking
- Shows DelayBadge in confirmation view
- Automatically displays discount code if earned

#### Usage

```javascript
// Backend - Calculate delay
POST /api/delay/calculate
{
  "bookingId": "507f1f77bcf86cd799439011",
  "origin": "Istanbul Airport",
  "destination": "Sultanahmet Hotel"
}

// Response
{
  "success": true,
  "message": "Delay risk calculated successfully",
  "data": {
    "delayRiskScore": 45,
    "estimatedDelay": 9,
    "discountCode": null,
    "route": {
      "origin": "Istanbul Airport",
      "destination": "Sultanahmet Hotel",
      "distance": 28.5,
      "estimatedDuration": 42
    }
  }
}
```

### 2. Smart Package Creator

#### Backend Components

**Service: `aiService.mjs - generateSmartPackage()`**
- Uses GPT-3.5-Turbo for intelligent recommendations
- Analyzes user booking history
- Recommends tour + transfer bundle with 15% discount
- Fallback to rule-based recommendations when AI unavailable

**Controller: `packageController.mjs`**
- `POST /api/packages/recommend` - Generate package for user ID
- `GET /api/packages/my-recommendation` - Get recommendation for authenticated user

**AI Logic**
1. Fetches user's booking history (last 20 bookings)
2. Gets available tours
3. Sends data to GPT-3.5-Turbo with structured prompt
4. Parses JSON response with recommended tour and reasoning
5. Calculates 15% discounted bundle price

**Fallback Logic**
- Recommends most expensive unbooked tour
- Simple rule-based reasoning
- Still applies 15% discount

#### Frontend Components

**Component: `SmartPackageModal.jsx`**
- Beautiful modal displaying AI recommendation
- Shows recommended tour title
- Displays AI reasoning for recommendation
- Highlights bundle price with 15% discount
- Lists package benefits
- "Book Now" and "Not Now" actions
- AI-powered badge

**Component: `TourCard.jsx` (Updated)**
- New optional prop: `showPackageButton`
- "Create Your Package" button with gradient styling
- Triggers package generation on click
- Loading state while generating
- Opens SmartPackageModal with results

#### Usage

```javascript
// Backend - Get package recommendation
POST /api/packages/recommend
{
  "userId": "507f1f77bcf86cd799439011"
}

// Response
{
  "success": true,
  "message": "Smart package generated successfully",
  "data": {
    "recommendedTour": "Bosphorus Sunset Cruise",
    "reasoning": "Based on your previous interest in Istanbul tours and water activities, this cruise offers a perfect blend of sightseeing and relaxation.",
    "bundlePrice": 127.5,
    "discount": 15,
    "tourId": "507f1f77bcf86cd799439012"
  }
}
```

## Environment Configuration

Add these API keys to `backend/.env`:

```env
# OpenAI API Key for GPT-3.5-Turbo
OPENAI_API_KEY=sk-your-openai-api-key

# OpenRouteService API Key (free tier available)
OPENROUTE_API_KEY=your-openroute-api-key
```

### Getting API Keys

**OpenAI:**
1. Sign up at https://platform.openai.com/
2. Navigate to API keys section
3. Create new secret key
4. Use GPT-3.5-Turbo model (cost-effective)

**OpenRouteService:**
1. Sign up at https://openrouteservice.org/
2. Request free API key
3. Free tier: 2,000 requests/day
4. Alternative: Use Mapbox (also has free tier)

## Cost Optimization

### GPT-3.5-Turbo
- Cost: ~$0.0015 per 1,000 tokens
- Average request: ~300 tokens
- Cost per recommendation: ~$0.00045
- 1,000 recommendations: ~$0.45

### OpenRouteService
- Free tier: 2,000 requests/day
- Sufficient for most booking volumes
- Fallback to mock calculations ensures availability

### Implementation Strategy
1. **Batch Processing**: Calculate delays during off-peak hours
2. **Caching**: Store delay metrics, recalculate only when needed
3. **Fallbacks**: Always have mock/rule-based alternatives
4. **Rate Limiting**: Prevent API abuse

## Translation Keys

Added to `src/locales/en/translation.json`:

```json
{
  "delay": {
    "guarantee": "Delay Guarantee",
    "lowRisk": "Low Risk",
    "mediumRisk": "Medium Risk",
    "highRisk": "High Risk",
    ...
  },
  "package": {
    "smartBundle": "Smart Package for You",
    "recommendedTour": "Recommended Tour",
    ...
  },
  "booking": {
    "confirmed": "Booking Confirmed!",
    "thankYou": "Thank you for your booking.",
    ...
  }
}
```

## Testing

### Backend Testing
```bash
# Start backend server
cd backend
npm run dev

# Test health check
curl http://localhost:5000/health

# Test delay calculation (requires MongoDB)
curl -X POST http://localhost:5000/api/delay/calculate \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"507f...", "origin":"Airport", "destination":"Hotel"}'

# Test package recommendation (requires MongoDB)
curl -X POST http://localhost:5000/api/packages/recommend \
  -H "Content-Type: application/json" \
  -d '{"userId":"507f..."}'
```

### Frontend Testing
1. Navigate to booking page
2. Complete a booking
3. Verify DelayBadge appears in confirmation
4. Check package button appears on tour cards
5. Click "Create Your Package"
6. Verify modal displays with recommendation

## Known Limitations & Future Improvements

### Current Implementation (Phase 2)
1. **Mock Coordinates**: Using fixed Istanbul coordinates for demo purposes
   - **Production TODO**: Implement geocoding service to convert addresses to coordinates
   
2. **Random Risk Factor**: Small random component in delay calculation
   - **Production TODO**: Replace with real-time traffic and weather data
   
3. **Hard-coded Route**: Booking page uses fixed origin/destination
   - **Production TODO**: Extract from tour details or add to booking form
   
4. **Simple Tour Selection**: Fallback recommends most expensive tour
   - **Production TODO**: Factor in tour categories, user preferences, popularity

5. **No Real-time Data**: Delay calculations are static/batch
   - **Production TODO**: Integrate real-time traffic APIs

These limitations are documented and intentional for Phase 2 implementation. All features include proper fallbacks and work without external APIs, making them safe to deploy.

## Monetization Impact

### Delay Guarantee (Trust & Conversion)
- **Transparency**: Builds trust with upfront delay information
- **Compensation**: Discount codes for delays > 15 min
- **Expected Impact**: 5-10% increase in conversion rate
- **Customer Retention**: Improved satisfaction from transparency

### Smart Package Creator (AOV Increase)
- **Upsell Opportunity**: Bundles transfer + tour
- **Personalization**: AI tailors to user preferences
- **Automatic Discount**: 15% off incentivizes booking
- **Expected Impact**: 15-25% increase in Average Order Value

## Future Enhancements

1. **Real-time Delay Tracking**: Integrate with traffic APIs
2. **Weather Integration**: Factor weather into delay calculations
3. **Historical Data**: Use actual delay data to improve predictions
4. **A/B Testing**: Test different discount percentages
5. **Multi-tour Packages**: Recommend multiple tour bundles
6. **Seasonal Recommendations**: Adjust based on season/events

## Security Considerations

- API keys stored in environment variables
- Never commit API keys to version control
- Rate limiting on all endpoints
- Input validation on all user data
- Sanitize AI responses before displaying

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check backend server logs
4. Verify API keys are set correctly
5. Ensure MongoDB is connected

## License

All code is part of the GNB Transfer project and follows the project's license terms.
