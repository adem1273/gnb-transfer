# AI Chat Assistant - Implementation Guide

## Overview

The AI Chat Assistant is a 24/7 multi-language AI-powered chatbot integrated into the GNB Transfer application. It provides two main interaction modes and supports 8 languages with intelligent fallback to human support.

## Features

### 1. Two Interaction Modes

#### Ask a Question Mode
- General inquiries about tours, services, pricing
- Tour recommendations based on natural language
- Information about the company and policies
- AI-powered responses in user's language

#### Manage Booking Mode
- Check booking status by ID and email
- Cancel bookings with automatic refund information
- Request booking modifications
- View booking details and history

### 2. Multi-Language Support

**Supported Languages:** English (EN), Arabic (AR), German (DE), Spanish (ES), Italian (IT), Russian (RU), Chinese (ZH), Hindi (HI)

**Features:**
- Automatic language detection from user's browser
- AI responds in user's preferred language
- All UI elements fully localized
- Fallback translation using OpenAI API for missing keys

### 3. Intelligent Features

**Natural Language Processing:**
- Intent classification (booking, tour_info, payment, complaint, general)
- Context-aware responses
- Conversation history maintained
- Smart tour recommendations

**Upsell & Affiliate Integration:**
- Personalized tour suggestions
- VIP service recommendations
- Inline upsell offers (no popups)
- Click tracking for affiliates
- Conversion logging to MongoDB

**Fallback Support:**
- Automatic support ticket creation when AI cannot help
- Human support escalation
- Conversation history preserved in tickets
- Priority routing based on issue type

## Setup Instructions

### Backend Setup

1. **Install Dependencies:**
```bash
cd backend
npm install
```

2. **Configure Environment Variables:**
Create a `.env` file in the backend directory:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-openai-api-key  # Required for AI features
STRIPE_SECRET_KEY=sk_test_your-stripe-key
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

3. **Start Backend Server:**
```bash
npm run dev  # Development with nodemon
# or
npm start    # Production
```

### Frontend Setup

1. **Install Dependencies:**
```bash
npm install  # Run from project root
```

2. **Configure Environment:**
Create `.env` file in project root:
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
```

3. **Start Frontend:**
```bash
npm run dev  # Starts Vite dev server on port 5173
```

## API Endpoints

### Chat Endpoints

#### Send Message
```http
POST /api/chat/message
Content-Type: application/json
Authorization: Bearer <token> (optional)

{
  "message": "I want to book a tour to Cappadocia",
  "language": "en",
  "mode": "question",
  "conversationHistory": [],
  "bookingId": null
}

Response:
{
  "success": true,
  "data": {
    "message": "I'd be happy to help you book a tour to Cappadocia!...",
    "intent": "tour_info",
    "recommendations": [
      {
        "id": "...",
        "title": "Cappadocia Hot Air Balloon Tour",
        "price": 150,
        "duration": "1 day",
        "discount": 10
      }
    ],
    "upsells": [],
    "needsHumanSupport": false
  }
}
```

#### Manage Booking
```http
POST /api/chat/booking/manage
Content-Type: application/json

{
  "bookingId": "507f1f77bcf86cd799439011",
  "email": "customer@example.com",
  "action": "check",  // check, cancel, or modify
  "language": "en"
}

Response:
{
  "success": true,
  "data": {
    "message": "Your booking: Cappadocia Tour. Status: confirmed. Amount: 150€",
    "booking": {
      "id": "507f1f77bcf86cd799439011",
      "tourTitle": "Cappadocia Tour",
      "status": "confirmed",
      "amount": 150,
      "date": "2025-11-15T10:00:00.000Z",
      "guests": 2
    },
    "upsells": []
  }
}
```

#### Create Support Ticket
```http
POST /api/chat/support-ticket
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about tour options",
  "message": "I need help choosing the right tour...",
  "language": "en",
  "category": "general",
  "conversationHistory": []
}

Response:
{
  "success": true,
  "data": {
    "ticketId": "...",
    "message": "Support ticket created. Our team will contact you shortly."
  }
}
```

#### Log Upsell Conversion
```http
POST /api/chat/log-upsell
Content-Type: application/json

{
  "bookingId": "507f1f77bcf86cd799439011",
  "upsellTourId": "507f1f77bcf86cd799439012",
  "upsellType": "tour"
}
```

#### Translate Text
```http
POST /api/chat/translate
Content-Type: application/json

{
  "text": "Welcome to GNB Transfer",
  "targetLanguage": "de"
}

Response:
{
  "success": true,
  "data": {
    "translated": "Willkommen bei GNB Transfer"
  }
}
```

## Database Models

### SupportTicket Model
```javascript
{
  name: String,              // Customer name
  email: String,             // Customer email
  subject: String,           // Ticket subject
  message: String,           // Detailed message
  status: String,            // open, in-progress, resolved, closed
  priority: String,          // low, medium, high, urgent
  category: String,          // booking, payment, general, technical, other
  language: String,          // User's preferred language
  aiAttempted: Boolean,      // Whether AI tried to help
  aiResponse: String,        // AI's response before escalation
  conversationHistory: [],   // Chat messages
  booking: ObjectId,         // Related booking (if any)
  user: ObjectId,            // Related user (if any)
  resolvedAt: Date,          // Resolution timestamp
  resolvedBy: ObjectId,      // Admin who resolved
  resolution: String,        // Resolution notes
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Model Updates
```javascript
{
  // ... existing fields ...
  upsells: [{
    tourId: ObjectId,        // Upsold tour
    type: String,            // tour, vip, addon
    timestamp: Date
  }]
}
```

## Component Usage

### LiveChat Component

The LiveChat component is automatically included in the main App layout and appears as a floating button in the bottom-right corner.

**Props:** None (uses global i18n and AuthContext)

**Features:**
- Automatic language detection
- Persistent conversation in session
- Real-time typing indicators
- Inline recommendations
- Booking management interface
- Support ticket escalation

**Example Integration:**
```jsx
import LiveChat from './components/LiveChat';

function App() {
  return (
    <>
      {/* Your app content */}
      <LiveChat />
    </>
  );
}
```

## Testing

### Manual Testing

1. **Test AI Responses:**
   - Open chat widget
   - Select "Ask a Question"
   - Send message: "What tours do you offer?"
   - Verify AI responds in correct language
   - Check for tour recommendations

2. **Test Booking Management:**
   - Select "Manage Booking"
   - Enter a valid booking ID
   - Test check status, cancel, modify actions
   - Verify booking information displayed correctly

3. **Test Multi-Language:**
   - Change browser language or use language selector
   - Verify UI updates to new language
   - Send messages and verify AI responds in same language

4. **Test Upsells:**
   - View a booking with recommendations
   - Click on upsell suggestions
   - Verify tracking logs to database

5. **Test Fallback:**
   - Send a complex query AI cannot handle
   - Verify support ticket is created
   - Check MongoDB for ticket entry

### Environment Testing

**Test without OpenAI API key:**
- AI features gracefully degrade
- Support tickets created instead
- No crashes or errors

**Test with rate limiting:**
- Send rapid messages
- Verify rate limiting prevents abuse
- Check appropriate error messages

## Troubleshooting

### Common Issues

**AI not responding:**
- Check `OPENAI_API_KEY` is set correctly
- Verify OpenAI API has available quota
- Check backend logs for API errors

**Language not switching:**
- Clear browser localStorage
- Check i18n configuration
- Verify translation files exist

**Upsells not showing:**
- Check database has active tours
- Verify tour query returns results
- Check console for errors

**Support tickets not creating:**
- Verify MongoDB connection
- Check SupportTicket model
- Review backend error logs

### Debug Mode

Enable debug logging:
```javascript
// In chatRoutes.mjs
console.log('Chat message received:', { message, language, mode });
```

Check browser console for:
- API request/response
- Translation loading
- Component state changes

## Performance Considerations

### Rate Limiting
- Global rate limit: 100 requests per 15 minutes per IP
- Strict rate limit (chat): 5 requests per 15 minutes
- Prevents API abuse and cost overruns

### Caching
- Tour data cached for 5 minutes
- Translation cache in localStorage
- Conversation history limited to last 10 messages

### Cost Optimization
- Use GPT-3.5-turbo (cheaper than GPT-4)
- Limit max_tokens to 500 per response
- Cache frequent queries
- Implement request timeout (30s)

## Security

### Authentication
- Optional authentication for chat
- Booking management requires email verification
- Admin-only ticket management routes

### Rate Limiting
- Protects against abuse
- Prevents cost overruns
- Separate limits for different endpoints

### Input Validation
- Message length limited to 1000 characters
- Email format validation
- Booking ID format validation
- SQL injection protection via Mongoose

### Data Privacy
- Conversation history not permanently stored
- Support tickets encrypted at rest
- PII redacted from logs
- GDPR compliant data handling

## Future Enhancements

1. **Voice Input:** Add speech-to-text for hands-free interaction
2. **Sentiment Analysis:** Detect frustrated customers and prioritize
3. **Advanced Analytics:** Track conversation quality metrics
4. **Proactive Suggestions:** AI suggests tours based on browsing history
5. **Multi-turn Booking:** Complete entire booking flow in chat
6. **Payment Integration:** Process payments directly in chat
7. **Admin Dashboard:** View and manage support tickets
8. **Custom Training:** Fine-tune AI on company-specific data

## Support

For issues or questions:
- Create a GitHub issue in the repository
- Contact: support@gnbtransfer.com
- Documentation: See `AI_FEATURES_API_DOCS.md`

## License

Part of GNB Transfer application. All rights reserved.
