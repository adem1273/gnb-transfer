import { useState, useEffect } from 'react';
import { optInAnalytics, optOutAnalytics, hasOptedOut } from '../utils/analytics';

/**
 * Cookie Consent Banner Component
 * Shows a banner for users to opt in/out of analytics tracking (GDPR compliance)
 */
export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsented = localStorage.getItem('analytics-consent');
    if (!hasConsented) {
      // Show banner after a short delay
      setTimeout(() => {
        setShowBanner(true);
        setTimeout(() => setIsVisible(true), 100);
      }, 2000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('analytics-consent', 'true');
    optInAnalytics();
    closeBanner();
  };

  const handleDecline = () => {
    localStorage.setItem('analytics-consent', 'false');
    optOutAnalytics();
    closeBanner();
  };

  const closeBanner = () => {
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-gray-900 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Message */}
            <div className="flex-1 text-sm md:text-base">
              <p className="mb-2">
                <strong>🍪 We value your privacy</strong>
              </p>
              <p className="text-gray-300">
                We use cookies and analytics to improve your experience, analyze site traffic, 
                and understand where our users come from. By clicking &quot;Accept&quot;, you consent 
                to our use of cookies and analytics tools.
              </p>
              <a 
                href="/privacy-policy" 
                className="text-blue-400 hover:text-blue-300 underline text-sm mt-1 inline-block"
              >
                Learn more in our Privacy Policy
              </a>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={handleDecline}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
