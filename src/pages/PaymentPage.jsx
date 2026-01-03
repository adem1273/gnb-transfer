import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PayTRPayment from '../components/PayTRPayment';

// Stripe public key from environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

/**
 * Stripe Checkout Form Component
 */
function StripeCheckoutForm({ bookingId, amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    try {
      // Create payment intent from backend
      const { data: clientSecret } = await API.post('/create-payment-intent', {
        amount: Math.round(amount * 100), // Convert to cents
        bookingId,
      });

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        if (onError) onError(stripeError.message);
      } else if (paymentIntent?.status === 'succeeded') {
        if (onSuccess) onSuccess(paymentIntent);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Payment failed';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <CardElement
          className="p-3 bg-white border border-gray-300 rounded"
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t('payment.processing') || 'Processing...'}
          </span>
        ) : (
          t('payment.payNow') || 'Pay Now'
        )}
      </button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>{t('payment.securedByStripe') || 'Secured by Stripe'}</span>
      </div>
    </form>
  );
}

/**
 * Payment Provider Selection Component
 */
function PaymentProviderSelector({ selected, onSelect, paytrAvailable, stripeAvailable }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('payment.selectProvider') || 'Select Payment Method'}
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Stripe Option */}
        {stripeAvailable && (
          <button
            type="button"
            onClick={() => onSelect('stripe')}
            className={`p-4 border-2 rounded-lg transition-all ${
              selected === 'stripe'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === 'stripe' ? 'border-blue-500' : 'border-gray-300'
                }`}
              >
                {selected === 'stripe' && <div className="w-3 h-3 rounded-full bg-blue-500" />}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800">
                  {t('payment.stripe.title') || 'Credit/Debit Card'}
                </div>
                <div className="text-sm text-gray-500">
                  {t('payment.stripe.description') || 'Visa, Mastercard, AMEX'}
                </div>
              </div>
              <div className="flex gap-1">
                <span className="text-2xl">💳</span>
              </div>
            </div>
          </button>
        )}

        {/* PayTR Option */}
        {paytrAvailable && (
          <button
            type="button"
            onClick={() => onSelect('paytr')}
            className={`p-4 border-2 rounded-lg transition-all ${
              selected === 'paytr'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === 'paytr' ? 'border-blue-500' : 'border-gray-300'
                }`}
              >
                {selected === 'paytr' && <div className="w-3 h-3 rounded-full bg-blue-500" />}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800">
                  {t('payment.paytr.title') || 'PayTR'}
                </div>
                <div className="text-sm text-gray-500">
                  {t('payment.paytr.description') || 'Turkish cards, Installments'}
                </div>
              </div>
              <div className="flex gap-1">
                <span className="text-2xl">🇹🇷</span>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Main Payment Page Component
 */
function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [paytrAvailable, setPaytrAvailable] = useState(false);
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Get booking ID from navigation state or URL params
  const bookingId = location.state?.bookingId;

  useEffect(() => {
    const initializePage = async () => {
      if (!bookingId) {
        setError(t('payment.noBookingId') || 'No booking found. Please create a booking first.');
        setLoading(false);
        return;
      }

      try {
        // Check available payment providers
        const [paytrConfig, bookingData] = await Promise.all([
          API.get('/payments/paytr/config').catch(() => ({
            data: { data: { configured: false } },
          })),
          API.get(`/bookings/${bookingId}`).catch(() => null),
        ]);

        // Check PayTR availability
        setPaytrAvailable(paytrConfig?.data?.data?.configured || false);

        // Check Stripe availability (based on env var)
        setStripeAvailable(!!import.meta.env.VITE_STRIPE_PUBLIC_KEY);

        if (bookingData?.data?.data) {
          setBooking(bookingData.data.data);

          // Auto-select first available provider
          if (paytrConfig?.data?.data?.configured) {
            setSelectedProvider('paytr');
          } else if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
            setSelectedProvider('stripe');
          }
        } else {
          setError(t('payment.bookingNotFound') || 'Booking not found');
        }
      } catch (err) {
        console.error('Error initializing payment page:', err);
        setError(err.message || t('payment.initError') || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [bookingId, t]);

  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentSuccess(true);
    // Redirect to success page after a short delay
    setTimeout(() => {
      navigate('/payment/success', {
        state: {
          bookingId,
          paymentId: paymentIntent?.id,
        },
      });
    }, 1500);
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
        <LoadingSpinner text={t('payment.loading') || 'Loading payment options...'} />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t('payment.successTitle') || 'Payment Successful!'}
          </h2>
          <p className="text-gray-600">
            {t('payment.redirecting') || 'Redirecting to confirmation page...'}
          </p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-4"
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
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            {t('payment.errorTitle') || 'Payment Error'}
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            to="/booking"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('payment.backToBooking') || 'Back to Booking'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {t('payment.title') || 'Complete Payment'}
      </h1>

      {/* Booking Summary */}
      {booking && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            {t('payment.bookingSummary') || 'Booking Summary'}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('payment.service') || 'Service'}:</span>
              <span className="font-medium">{booking.tour?.title || booking.tourId || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('payment.date') || 'Date'}:</span>
              <span className="font-medium">
                {booking.date ? new Date(booking.date).toLocaleDateString() : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('payment.guests') || 'Guests'}:</span>
              <span className="font-medium">{booking.guests || 1}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between">
              <span className="font-semibold text-gray-800">
                {t('payment.totalAmount') || 'Total Amount'}:
              </span>
              <span className="font-bold text-blue-600 text-lg">
                ${booking.amount?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Payment Provider Selection */}
      {(paytrAvailable || stripeAvailable) && (
        <div className="mb-6">
          <PaymentProviderSelector
            selected={selectedProvider}
            onSelect={setSelectedProvider}
            paytrAvailable={paytrAvailable}
            stripeAvailable={stripeAvailable}
          />
        </div>
      )}

      {/* Payment Form */}
      {selectedProvider === 'stripe' && stripeAvailable && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            {t('payment.stripe.title') || 'Credit/Debit Card Payment'}
          </h3>
          <Elements stripe={stripePromise}>
            <StripeCheckoutForm
              bookingId={bookingId}
              amount={booking?.amount || 0}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
        </div>
      )}

      {selectedProvider === 'paytr' && paytrAvailable && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            {t('payment.paytr.title') || 'PayTR Payment'}
          </h3>
          <PayTRPayment
            bookingId={bookingId}
            amount={booking?.amount || 0}
            onError={handlePaymentError}
          />
        </div>
      )}

      {/* No Payment Methods Available */}
      {!paytrAvailable && !stripeAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-yellow-400 mx-auto mb-4"
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
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            {t('payment.noPaymentMethods') || 'No Payment Methods Available'}
          </h2>
          <p className="text-yellow-600 mb-4">
            {t('payment.contactSupport') ||
              'Online payment is currently unavailable. Please contact support or pay on arrival.'}
          </p>
          <Link
            to="/contact"
            className="inline-block px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            {t('payment.contactUs') || 'Contact Us'}
          </Link>
        </div>
      )}

      {/* Back to Booking Link */}
      <div className="mt-6 text-center">
        <Link to="/booking" className="text-blue-600 hover:text-blue-800 text-sm">
          ← {t('payment.backToBooking') || 'Back to Booking'}
        </Link>
      </div>
    </div>
  );
}

export default PaymentPage;
