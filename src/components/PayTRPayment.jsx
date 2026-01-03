import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

/**
 * PayTR Payment Component
 *
 * Handles PayTR payment gateway integration for Turkish market.
 * Creates a payment token and auto-submits to PayTR iframe.
 *
 * @param {Object} props
 * @param {string} props.bookingId - MongoDB ObjectId of the booking
 * @param {number} props.amount - Amount to be paid
 * @param {Function} props.onError - Callback when error occurs
 */
function PayTRPayment({ bookingId, amount, onError }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [paytrConfigured, setPaytrConfigured] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        // First check if PayTR is configured
        const configRes = await API.get('/payments/paytr/config');
        if (!configRes.data?.data?.configured) {
          setError(t('payment.paytr.notConfigured') || 'PayTR payment is not available');
          setPaytrConfigured(false);
          setLoading(false);
          return;
        }
        setPaytrConfigured(true);

        // Create payment token
        const baseUrl = window.location.origin;
        const response = await API.post('/payments/paytr/create', {
          bookingId,
          successUrl: `${baseUrl}/payment/success`,
          failUrl: `${baseUrl}/payment/failed`,
          maxInstallment: 12, // Allow installments
        });

        if (response.data?.success && response.data?.data?.iframeUrl) {
          setIframeUrl(response.data.data.iframeUrl);
        } else {
          throw new Error(response.data?.error || 'Failed to create payment');
        }
      } catch (err) {
        console.error('PayTR payment initialization error:', err);
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          t('payment.paytr.initError') ||
          'Payment initialization failed';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      initializePayment();
    }
  }, [bookingId, t, onError]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4 text-center">
          {t('payment.paytr.loading') || 'Preparing secure payment...'}
        </p>
        <p className="text-gray-600 mt-2 text-center text-sm">
          {t('payment.paytr.redirecting') || 'You will be redirected to the secure payment page'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-300 bg-red-50 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-red-800">
            {t('payment.paytr.errorTitle') || 'Payment Error'}
          </h3>
        </div>
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {t('payment.paytr.retry') || 'Try Again'}
        </button>
      </div>
    );
  }

  if (!paytrConfigured) {
    return (
      <div className="p-6 border border-yellow-300 bg-yellow-50 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-6 h-6 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-yellow-800">
            {t('payment.paytr.unavailable') || 'Payment Unavailable'}
          </h3>
        </div>
        <p className="text-yellow-700">
          {t('payment.paytr.notConfigured') ||
            'PayTR payment is currently not available. Please try another payment method.'}
        </p>
      </div>
    );
  }

  return (
    <div className="paytr-payment-container">
      {/* Payment Amount Display */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">
            {t('payment.paytr.amount') || 'Payment Amount'}:
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {amount ? `$${amount.toFixed(2)}` : '-'}
          </span>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 text-green-700 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>
            {t('payment.paytr.secureConnection') ||
              'Your payment is secured with 256-bit SSL encryption'}
          </span>
        </div>
      </div>

      {/* PayTR iframe */}
      {iframeUrl && (
        <div className="paytr-iframe-wrapper border border-gray-200 rounded-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            title="PayTR Secure Payment"
            className="w-full min-h-[500px]"
            frameBorder="0"
            scrolling="yes"
            allowFullScreen
          />
        </div>
      )}

      {/* Payment Info */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        <p>{t('payment.paytr.poweredBy') || 'Secure payments powered by PayTR'}</p>
        <p className="mt-1">
          {t('payment.paytr.supportedCards') || 'Visa, Mastercard, American Express, Troy and more'}
        </p>
      </div>
    </div>
  );
}

export default PayTRPayment;
