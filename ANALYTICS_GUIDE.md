# Analytics Integration Guide

## Overview

The GNB Transfer application includes comprehensive analytics tracking for Google Analytics 4 (GA4) and Microsoft Clarity. This guide explains how to set up and use analytics throughout the application.

## Setup

### 1. Google Analytics 4

1. **Create GA4 Property**:
   - Go to [Google Analytics](https://analytics.google.com)
   - Click "Admin" > "Create Property"
   - Fill in property details
   - Create a "Web" data stream
   - Copy the Measurement ID (format: G-XXXXXXXXXX)

2. **Configure Environment Variable**:
   ```env
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Verify Setup**:
   - Visit your website
   - Open browser DevTools > Network tab
   - Look for requests to `google-analytics.com`
   - Check GA4 real-time reports

### 2. Microsoft Clarity

1. **Create Clarity Project**:
   - Go to [Microsoft Clarity](https://clarity.microsoft.com)
   - Sign in with Microsoft account
   - Click "Add new project"
   - Enter website details
   - Copy the Project ID

2. **Configure Environment Variable**:
   ```env
   VITE_CLARITY_PROJECT_ID=your_project_id
   ```

3. **Verify Setup**:
   - Visit your website
   - Open browser DevTools > Network tab
   - Look for requests to `clarity.ms`
   - Check Clarity dashboard for recordings

## Usage

### Basic Setup in React App

#### 1. Wrap App with AnalyticsProvider

```jsx
// src/App.jsx
import { AnalyticsProvider } from './context/AnalyticsContext';
import CookieConsent from './components/CookieConsent';

function App() {
  return (
    <AnalyticsProvider>
      {/* Your app components */}
      <CookieConsent />
    </AnalyticsProvider>
  );
}
```

#### 2. Use Analytics Hook in Components

```jsx
import { useAnalytics } from '../context/AnalyticsContext';

function TourDetailsPage({ tour }) {
  const analytics = useAnalytics();

  useEffect(() => {
    // Track tour view
    analytics.trackTourView(tour.id, tour.name);
  }, [tour]);

  const handleBookNow = () => {
    // Track booking start
    analytics.trackBookingStart(tour.name, tour.price);
    // ... booking logic
  };

  return (
    <div>
      {/* Tour details */}
      <button onClick={handleBookNow}>Book Now</button>
    </div>
  );
}
```

## Available Analytics Functions

### Page Tracking

Page views are automatically tracked on route changes. No manual tracking needed.

### Conversion Events

#### Booking Flow

```jsx
// Start booking
analytics.trackBookingStart(tourName, tourPrice);

// Complete booking
analytics.trackBookingComplete(
  bookingId,
  tourName,
  tourPrice,
  'credit_card'
);
```

#### Payment Events

```jsx
// Payment success
analytics.trackPaymentSuccess(bookingId, amount, 'stripe');

// Payment failure
analytics.trackPaymentFailure(bookingId, errorMessage, 'stripe');
```

### User Engagement

#### Search

```jsx
const handleSearch = (query) => {
  const results = performSearch(query);
  analytics.trackSearch(query, results.length);
};
```

#### Product Views

```jsx
analytics.trackTourView(tourId, tourName);
```

#### Add to Cart

```jsx
analytics.trackAddToCart(tourId, tourName, tourPrice);
```

#### Forms

```jsx
const handleSubmit = () => {
  analytics.trackContactFormSubmit('contact_page');
  // ... form submission logic
};
```

#### Newsletter Signup

```jsx
analytics.trackNewsletterSignup(email);
```

#### Social Sharing

```jsx
const handleShare = (platform) => {
  analytics.trackSocialShare(platform, 'tour_page');
};
```

#### Chat Interactions

```jsx
// Track chat start
const chatStartTime = Date.now();

// Track chat end
const duration = (Date.now() - chatStartTime) / 1000;
analytics.trackChatInteraction('chat_ended', duration);
```

#### Upsell Clicks

```jsx
analytics.trackUpsellClick('premium_package', 'checkout_page');
```

### User Identification

```jsx
// When user logs in
analytics.identifyUser(user.id, {
  email: user.email,
  name: user.name,
  plan: 'free',
});

// Set user properties
analytics.setUserProperties({
  preferred_language: 'en',
  country: 'US',
});
```

### Error Tracking

```jsx
try {
  // ... code that might throw
} catch (error) {
  analytics.trackError(error.message, false);
  // ... error handling
}
```

### Performance Tracking

```jsx
const startTime = performance.now();

// ... perform operation

const duration = performance.now() - startTime;
analytics.trackTiming('api_call', 'fetch_tours', duration);
```

## Example: Complete Booking Flow

```jsx
import { useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';

function BookingPage({ tour }) {
  const analytics = useAnalytics();
  const [bookingStarted, setBookingStarted] = useState(false);

  const handleStartBooking = () => {
    // Track booking start
    analytics.trackBookingStart(tour.name, tour.price);
    setBookingStarted(true);
  };

  const handlePayment = async (paymentData) => {
    try {
      // Process payment
      const result = await processPayment(paymentData);

      if (result.success) {
        // Track successful payment
        analytics.trackPaymentSuccess(
          result.bookingId,
          tour.price,
          'credit_card'
        );

        // Track completed booking
        analytics.trackBookingComplete(
          result.bookingId,
          tour.name,
          tour.price,
          'credit_card'
        );
      }
    } catch (error) {
      // Track failed payment
      analytics.trackPaymentFailure(
        bookingId,
        error.message,
        'credit_card'
      );
      
      analytics.trackError(`Payment failed: ${error.message}`, false);
    }
  };

  return (
    <div>
      {!bookingStarted ? (
        <button onClick={handleStartBooking}>
          Start Booking
        </button>
      ) : (
        <PaymentForm onSubmit={handlePayment} />
      )}
    </div>
  );
}
```

## Privacy and GDPR Compliance

### Cookie Consent Banner

The `CookieConsent` component is included to comply with GDPR requirements:

```jsx
import CookieConsent from './components/CookieConsent';

function App() {
  return (
    <>
      {/* Your app */}
      <CookieConsent />
    </>
  );
}
```

### Opt-Out Functionality

Users can opt out of analytics tracking:

```jsx
import { optOutAnalytics, optInAnalytics, hasOptedOut } from '../utils/analytics';

// Check if user has opted out
if (hasOptedOut()) {
  console.log('User has opted out of analytics');
}

// Opt out
optOutAnalytics();

// Opt in
optInAnalytics();
```

### Privacy Settings Page

```jsx
function PrivacySettings() {
  const [trackingEnabled, setTrackingEnabled] = useState(!hasOptedOut());

  const handleToggle = (enabled) => {
    if (enabled) {
      optInAnalytics();
    } else {
      optOutAnalytics();
    }
    setTrackingEnabled(enabled);
  };

  return (
    <div>
      <h2>Privacy Settings</h2>
      <label>
        <input
          type="checkbox"
          checked={trackingEnabled}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        Enable analytics tracking
      </label>
    </div>
  );
}
```

## Testing Analytics

### Development Testing

1. **Enable Debug Mode** (GA4):
   ```javascript
   window.gtag('config', 'G-XXXXXXXXXX', {
     'debug_mode': true
   });
   ```

2. **Use Browser Extensions**:
   - Google Analytics Debugger (Chrome)
   - Tag Assistant (Chrome)

3. **Check Console Logs**:
   - Analytics events are logged to console in development

### Production Testing

1. **Real-Time Reports** (GA4):
   - Go to Reports > Realtime
   - Perform actions on your site
   - Verify events appear in real-time

2. **Debug View** (GA4):
   - Enable debug mode
   - Send test events
   - View in DebugView

3. **Clarity Recordings**:
   - Visit your site
   - Wait a few minutes
   - Check Clarity dashboard for recordings

## Best Practices

1. **Track Key Events**: Focus on conversion-critical events
2. **Consistent Naming**: Use consistent event names across the app
3. **Include Context**: Add relevant parameters to events
4. **Respect Privacy**: Always check opt-out before tracking
5. **Test Thoroughly**: Verify events in GA4 and Clarity dashboards
6. **Document Events**: Keep a list of all tracked events
7. **Monitor Performance**: Ensure analytics don't slow down the app

## Troubleshooting

### Analytics Not Working

1. **Check Environment Variables**:
   ```bash
   echo $VITE_GA_MEASUREMENT_ID
   echo $VITE_CLARITY_PROJECT_ID
   ```

2. **Check Browser Console**:
   - Look for errors
   - Verify analytics initialization logs

3. **Check Network Tab**:
   - Look for requests to analytics services
   - Verify requests are successful

4. **Verify Opt-Out Status**:
   ```javascript
   console.log('Opted out:', hasOptedOut());
   ```

### Events Not Appearing in GA4

1. **Check Real-Time Reports**: Events may take time to appear in standard reports
2. **Verify Event Names**: GA4 is case-sensitive
3. **Check Debug View**: Enable debug mode to see events immediately
4. **Review Data Filters**: Ensure no filters are excluding your data

### Clarity Not Recording

1. **Wait**: Recordings may take a few minutes to appear
2. **Check Project ID**: Verify correct project ID in environment variables
3. **Disable Ad Blockers**: Ad blockers may block Clarity
4. **Check Privacy Settings**: Ensure user hasn't opted out

## Additional Resources

- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Microsoft Clarity Documentation](https://docs.microsoft.com/en-us/clarity/)
- [GDPR Compliance Guide](https://gdpr.eu/)

---

**Note**: Always respect user privacy and comply with local data protection regulations (GDPR, CCPA, etc.).
