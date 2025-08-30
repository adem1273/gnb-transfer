import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import API from '../utils/api';

// Stripe public key'inizi buraya ekleyin
const stripePromise = loadStripe('pk_test_...'); 

const CheckoutForm = ({ bookingId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      return;
    }

    // Ödeme amacını backend'den oluştur
    try {
      // Örnek bir miktar gönderiliyor, bu gerçek uygulamada dinamik olmalı
      const { data: clientSecret } = await API.post('/create-payment-intent', {
        amount: 5000 // 50.00 TL için 5000 kuruş
      });

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        setError(`Payment failed: ${error.message}`);
        setLoading(false);
      } else {
        setError(null);
        setSucceeded(true);
        console.log('Payment succeeded:', paymentIntent);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded shadow-lg">
      <h3 className="text-xl font-bold mb-4">Payment Information</h3>
      <CardElement className="p-2 border rounded" />
      <button
        className="w-full bg-blue-600 text-white p-2 rounded mt-4 hover:bg-blue-700"
        type="submit"
        disabled={!stripe || loading || succeeded}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {succeeded && <p className="text-green-500 mt-2">Payment succeeded!</p>}
    </form>
  );
};

const StripePayment = ({ bookingId }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm bookingId={bookingId} />
    </Elements>
  );
};

export default StripePayment;