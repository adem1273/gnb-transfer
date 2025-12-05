import { createContext, useContext, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  initGA4,
  initClarity,
  trackPageView,
  trackEvent,
  trackBookingStart,
  trackBookingComplete,
  trackPaymentSuccess,
  trackPaymentFailure,
  trackSearch,
  trackTourView,
  trackAddToCart,
  trackContactFormSubmit,
  trackNewsletterSignup,
  trackSocialShare,
  trackChatInteraction,
  trackUpsellClick,
  setUserProperties,
  identifyUser,
  trackError,
  trackTiming,
  hasOptedOut,
} from '../utils/analytics';

const AnalyticsContext = createContext(null);

/**
 * Analytics Provider Component
 * Wraps the app to provide analytics tracking functionality
 */
export function AnalyticsProvider({ children }) {
  const location = useLocation();

  // Initialize analytics on mount
  useEffect(() => {
    // Check if user has opted out
    if (hasOptedOut()) {
      console.log('Analytics tracking disabled by user preference');
      return;
    }

    // Initialize Google Analytics 4
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId) {
      initGA4(gaId);
      // Store GA ID globally for opt-out functionality
      if (typeof window !== 'undefined') {
        window.GA_MEASUREMENT_ID = gaId;
      }
    } else {
      console.warn('Google Analytics 4 Measurement ID not configured');
    }

    // Initialize Microsoft Clarity
    const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID;
    if (clarityId) {
      initClarity(clarityId);
    } else {
      console.warn('Microsoft Clarity Project ID not configured');
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!hasOptedOut()) {
      const pageTitle = document.title;
      const pagePath = location.pathname + location.search;
      trackPageView(pagePath, pageTitle);
    }
  }, [location]);

  // Analytics functions wrapped with opt-out check
  const analytics = {
    trackEvent: useCallback((eventName, eventData) => {
      if (!hasOptedOut()) {
        trackEvent(eventName, eventData);
      }
    }, []),

    trackBookingStart: useCallback((tourName, tourPrice) => {
      if (!hasOptedOut()) {
        trackBookingStart(tourName, tourPrice);
      }
    }, []),

    trackBookingComplete: useCallback((bookingId, tourName, tourPrice, paymentMethod) => {
      if (!hasOptedOut()) {
        trackBookingComplete(bookingId, tourName, tourPrice, paymentMethod);
      }
    }, []),

    trackPaymentSuccess: useCallback((bookingId, amount, method) => {
      if (!hasOptedOut()) {
        trackPaymentSuccess(bookingId, amount, method);
      }
    }, []),

    trackPaymentFailure: useCallback((bookingId, error, method) => {
      if (!hasOptedOut()) {
        trackPaymentFailure(bookingId, error, method);
      }
    }, []),

    trackSearch: useCallback((searchQuery, resultsCount) => {
      if (!hasOptedOut()) {
        trackSearch(searchQuery, resultsCount);
      }
    }, []),

    trackTourView: useCallback((tourId, tourName) => {
      if (!hasOptedOut()) {
        trackTourView(tourId, tourName);
      }
    }, []),

    trackAddToCart: useCallback((tourId, tourName, tourPrice) => {
      if (!hasOptedOut()) {
        trackAddToCart(tourId, tourName, tourPrice);
      }
    }, []),

    trackContactFormSubmit: useCallback((formType) => {
      if (!hasOptedOut()) {
        trackContactFormSubmit(formType);
      }
    }, []),

    trackNewsletterSignup: useCallback((email) => {
      if (!hasOptedOut()) {
        trackNewsletterSignup(email);
      }
    }, []),

    trackSocialShare: useCallback((platform, content) => {
      if (!hasOptedOut()) {
        trackSocialShare(platform, content);
      }
    }, []),

    trackChatInteraction: useCallback((action, duration) => {
      if (!hasOptedOut()) {
        trackChatInteraction(action, duration);
      }
    }, []),

    trackUpsellClick: useCallback((productName, location) => {
      if (!hasOptedOut()) {
        trackUpsellClick(productName, location);
      }
    }, []),

    setUserProperties: useCallback((properties) => {
      if (!hasOptedOut()) {
        setUserProperties(properties);
      }
    }, []),

    identifyUser: useCallback((userId, traits) => {
      if (!hasOptedOut()) {
        identifyUser(userId, traits);
      }
    }, []),

    trackError: useCallback((description, fatal) => {
      if (!hasOptedOut()) {
        trackError(description, fatal);
      }
    }, []),

    trackTiming: useCallback((category, variable, value) => {
      if (!hasOptedOut()) {
        trackTiming(category, variable, value);
      }
    }, []),
  };

  return <AnalyticsContext.Provider value={analytics}>{children}</AnalyticsContext.Provider>;
}

/**
 * Hook to use analytics
 * @returns {object} Analytics functions
 */
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

export default AnalyticsProvider;
