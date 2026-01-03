import { useEffect, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Payment Success Page
 *
 * Displayed after a successful payment from either Stripe or PayTR.
 * Fetches booking details and displays confirmation.
 */
function PaymentSuccess() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  // Get booking ID from state or URL params (PayTR redirects with params)
  const bookingId = location.state?.bookingId || searchParams.get('bookingId');

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
        console.error('Error fetching booking details:', err);
        // Don't show error to user - still show success message
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
        <LoadingSpinner text={t('payment.success.loading') || 'Loading confirmation...'} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {t('payment.success.title') || 'Payment Successful!'}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('payment.success.message') ||
            'Thank you for your payment. Your booking has been confirmed.'}
        </p>

        {/* Booking Details */}
        {booking && (
          <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-center">
              {t('payment.success.bookingDetails') || 'Booking Details'}
            </h3>
            <div className="space-y-3 text-sm">
              {booking.bookingReference && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">
                    {t('payment.success.reference') || 'Reference'}:
                  </span>
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                    {booking.bookingReference}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.success.service') || 'Service'}:</span>
                <span className="font-medium">{booking.tour?.title || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.success.name') || 'Name'}:</span>
                <span className="font-medium">{booking.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.success.email') || 'Email'}:</span>
                <span className="font-medium">{booking.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.success.date') || 'Date'}:</span>
                <span className="font-medium">
                  {booking.date ? new Date(booking.date).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.success.guests') || 'Guests'}:</span>
                <span className="font-medium">{booking.guests || 1}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-semibold text-gray-800">
                  {t('payment.success.amountPaid') || 'Amount Paid'}:
                </span>
                <span className="font-bold text-green-600 text-lg">
                  ${booking.amount?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div className="text-left">
              <p className="font-medium text-blue-800">
                {t('payment.success.emailSent') || 'Confirmation email sent'}
              </p>
              <p className="text-sm text-blue-600">
                {t('payment.success.emailInfo') ||
                  'You will receive a confirmation email with all the details shortly.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {t('payment.success.backToHome') || 'Back to Home'}
          </Link>
          <Link
            to="/booking"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            {t('payment.success.newBooking') || 'Make Another Booking'}
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-sm text-gray-500">
          <p>{t('payment.success.questions') || 'Have questions about your booking?'}</p>
          <Link to="/contact" className="text-blue-600 hover:text-blue-800">
            {t('payment.success.contactUs') || 'Contact our support team'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
