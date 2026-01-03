import { useEffect, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Payment Failed Page
 *
 * Displayed after a failed payment from either Stripe or PayTR.
 * Provides user with options to retry or contact support.
 */
function PaymentFailed() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  // Get booking ID from state or URL params (PayTR redirects with params)
  const bookingId = location.state?.bookingId || searchParams.get('bookingId');
  const errorMessage = location.state?.error || searchParams.get('error');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        const response = await API.get(`/bookings/${bookingId}`);
        if (response.data?.data) {
          setBooking(response.data.data);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching booking details:', err);
        // Don't show error - still show failure message
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4">{t('payment.failed.loading') || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Failure Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {t('payment.failed.title') || 'Payment Failed'}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('payment.failed.message') ||
            'We were unable to process your payment. Your booking has not been charged.'}
        </p>

        {/* Error Details */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"
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
              <div>
                <p className="font-medium text-red-800">
                  {t('payment.failed.errorDetails') || 'Error Details'}
                </p>
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Booking Info */}
        {booking && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">
              {t('payment.failed.bookingInfo') || 'Your Booking'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.failed.service') || 'Service'}:</span>
                <span className="font-medium">{booking.tour?.title || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.failed.date') || 'Date'}:</span>
                <span className="font-medium">
                  {booking.date ? new Date(booking.date).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.failed.amount') || 'Amount'}:</span>
                <span className="font-medium">${booking.amount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Helpful Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-yellow-800 mb-2">
            {t('payment.failed.tips') || 'Please check the following:'}
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• {t('payment.failed.tip1') || 'Ensure your card details are correct'}</li>
            <li>• {t('payment.failed.tip2') || 'Check if your card has sufficient funds'}</li>
            <li>• {t('payment.failed.tip3') || 'Your card may have online transaction limits'}</li>
            <li>• {t('payment.failed.tip4') || 'Try using a different payment method'}</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {bookingId && (
            <Link
              to="/payment"
              state={{ bookingId }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {t('payment.failed.tryAgain') || 'Try Again'}
            </Link>
          )}
          <Link
            to="/contact"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            {t('payment.failed.contactSupport') || 'Contact Support'}
          </Link>
        </div>

        {/* Alternative Payment */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            {t('payment.failed.alternative') ||
              'You can also pay cash on arrival if online payment is not working for you.'}
          </p>
          <Link
            to="/booking"
            className="inline-block mt-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            {t('payment.failed.newBooking') || 'Create a new booking with cash payment'}
          </Link>
        </div>

        {/* Back to Home */}
        <div className="mt-6">
          <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← {t('payment.failed.backToHome') || 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailed;
