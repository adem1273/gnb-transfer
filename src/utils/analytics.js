/**
 * Analytics Integration for GNB Transfer
 * Supports Google Analytics 4 and Microsoft Clarity
 */

// Check if Google Analytics is loaded
const isGALoaded = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Check if Microsoft Clarity is loaded
const isClarityLoaded = () => {
  return typeof window !== 'undefined' && typeof window.clarity === 'function';
};

/**
 * Initialize Google Analytics 4
 * @param {string} measurementId - GA4 Measurement ID (G-XXXXXXXXXX)
 */
export const initGA4 = (measurementId) => {
  if (!measurementId || typeof window === 'undefined') {
    console.warn('Google Analytics not initialized: Invalid measurement ID or not in browser');
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We'll send page views manually
  });

  console.log('Google Analytics 4 initialized');
};

/**
 * Initialize Microsoft Clarity
 * @param {string} projectId - Clarity Project ID
 */
export const initClarity = (projectId) => {
  if (!projectId || typeof window === 'undefined') {
    console.warn('Microsoft Clarity not initialized: Invalid project ID or not in browser');
    return;
  }

  // Load Clarity script
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", projectId);

  console.log('Microsoft Clarity initialized');
};

/**
 * Track page view
 * @param {string} path - Page path
 * @param {string} title - Page title
 */
export const trackPageView = (path, title) => {
  // Google Analytics
  if (isGALoaded()) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  }

  // Clarity (automatically tracks page views)
  // No explicit call needed

  console.log('Page view tracked:', { path, title });
};

/**
 * Track custom event
 * @param {string} eventName - Event name
 * @param {object} eventData - Event parameters
 */
export const trackEvent = (eventName, eventData = {}) => {
  // Google Analytics
  if (isGALoaded()) {
    window.gtag('event', eventName, eventData);
  }

  // Clarity
  if (isClarityLoaded()) {
    window.clarity('set', eventName, JSON.stringify(eventData));
  }

  console.log('Event tracked:', eventName, eventData);
};

/**
 * Track booking/conversion events
 */
export const trackBookingStart = (tourName, tourPrice) => {
  trackEvent('booking_start', {
    tour_name: tourName,
    tour_price: tourPrice,
    currency: 'EUR',
  });
};

export const trackBookingComplete = (bookingId, tourName, tourPrice, paymentMethod) => {
  // Google Analytics - Enhanced Ecommerce
  if (isGALoaded()) {
    window.gtag('event', 'purchase', {
      transaction_id: bookingId,
      value: tourPrice,
      currency: 'EUR',
      items: [{
        item_id: bookingId,
        item_name: tourName,
        price: tourPrice,
        quantity: 1,
      }],
      payment_type: paymentMethod,
    });
  }

  // Clarity
  if (isClarityLoaded()) {
    window.clarity('set', 'booking_complete', JSON.stringify({
      bookingId,
      tourName,
      tourPrice,
      paymentMethod,
    }));
  }

  console.log('Booking complete tracked:', { bookingId, tourName, tourPrice });
};

export const trackPaymentSuccess = (bookingId, amount, method) => {
  trackEvent('payment_success', {
    booking_id: bookingId,
    amount: amount,
    currency: 'EUR',
    payment_method: method,
  });
};

export const trackPaymentFailure = (bookingId, error, method) => {
  trackEvent('payment_failure', {
    booking_id: bookingId,
    error_message: error,
    payment_method: method,
  });
};

/**
 * Track user engagement events
 */
export const trackSearch = (searchQuery, resultsCount) => {
  trackEvent('search', {
    search_term: searchQuery,
    results_count: resultsCount,
  });
};

export const trackTourView = (tourId, tourName) => {
  trackEvent('view_item', {
    item_id: tourId,
    item_name: tourName,
  });
};

export const trackAddToCart = (tourId, tourName, tourPrice) => {
  trackEvent('add_to_cart', {
    item_id: tourId,
    item_name: tourName,
    price: tourPrice,
    currency: 'EUR',
  });
};

export const trackContactFormSubmit = (formType) => {
  trackEvent('contact_form_submit', {
    form_type: formType,
  });
};

export const trackNewsletterSignup = (email) => {
  trackEvent('newsletter_signup', {
    method: 'website_footer',
  });
};

export const trackSocialShare = (platform, content) => {
  trackEvent('share', {
    method: platform,
    content_type: content,
  });
};

export const trackChatInteraction = (action, duration) => {
  trackEvent('chat_interaction', {
    action: action,
    duration_seconds: duration,
  });
};

export const trackUpsellClick = (productName, location) => {
  trackEvent('upsell_click', {
    product_name: productName,
    location: location,
  });
};

/**
 * Track user properties
 * @param {object} properties - User properties
 */
export const setUserProperties = (properties) => {
  // Google Analytics
  if (isGALoaded()) {
    window.gtag('set', 'user_properties', properties);
  }

  // Clarity
  if (isClarityLoaded()) {
    Object.entries(properties).forEach(([key, value]) => {
      window.clarity('set', key, value);
    });
  }

  console.log('User properties set:', properties);
};

/**
 * Identify user (for logged-in users)
 * @param {string} userId - User ID
 * @param {object} traits - User traits
 */
export const identifyUser = (userId, traits = {}) => {
  // Google Analytics
  if (isGALoaded()) {
    window.gtag('config', window.GA_MEASUREMENT_ID, {
      user_id: userId,
    });
  }

  // Clarity
  if (isClarityLoaded()) {
    window.clarity('identify', userId, traits);
  }

  console.log('User identified:', userId);
};

/**
 * Track errors and exceptions
 * @param {string} description - Error description
 * @param {boolean} fatal - Whether error is fatal
 */
export const trackError = (description, fatal = false) => {
  // Google Analytics
  if (isGALoaded()) {
    window.gtag('event', 'exception', {
      description: description,
      fatal: fatal,
    });
  }

  console.error('Error tracked:', description);
};

/**
 * Track timing/performance
 * @param {string} category - Timing category
 * @param {string} variable - Timing variable name
 * @param {number} value - Time in milliseconds
 */
export const trackTiming = (category, variable, value) => {
  // Google Analytics
  if (isGALoaded()) {
    window.gtag('event', 'timing_complete', {
      name: variable,
      value: value,
      event_category: category,
    });
  }

  console.log('Timing tracked:', { category, variable, value });
};

/**
 * Opt out of analytics tracking
 */
export const optOutAnalytics = () => {
  if (typeof window !== 'undefined' && window.GA_MEASUREMENT_ID) {
    window[`ga-disable-${window.GA_MEASUREMENT_ID}`] = true;
    localStorage.setItem('analytics-opt-out', 'true');
    console.log('Analytics tracking disabled');
  }
};

/**
 * Opt in to analytics tracking
 */
export const optInAnalytics = () => {
  if (typeof window !== 'undefined' && window.GA_MEASUREMENT_ID) {
    window[`ga-disable-${window.GA_MEASUREMENT_ID}`] = false;
    localStorage.removeItem('analytics-opt-out');
    console.log('Analytics tracking enabled');
  }
};

/**
 * Check if user has opted out
 * @returns {boolean}
 */
export const hasOptedOut = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('analytics-opt-out') === 'true';
};

export default {
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
  optOutAnalytics,
  optInAnalytics,
  hasOptedOut,
};
