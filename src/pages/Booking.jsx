import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useTranslation } from 'react-i18next';
import TourCard from '../components/TourCard';
import DelayBadge from '../components/DelayBadge';
import { useAuth } from '../context/AuthContext';

function Booking() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    tourId: '', 
    paymentMethod: 'cash',
    guests: 1,
    date: '',
    pickupLocation: '',
    notes: ''
  });
  const [tours, setTours] = useState([]);
  const [recommendedTours, setRecommendedTours] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingTours, setLoadingTours] = useState(true);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [delayMetrics, setDelayMetrics] = useState(null);
  const [loadingDelay, setLoadingDelay] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await API.get('/tours');
        setTours(res.data);
        setLoadingTours(false);
      } catch (err) {
        console.error(err);
        setError(t('messages.loadToursFailed'));
        setLoadingTours(false);
      }
    };
    fetchTours();
  }, [t]);

  // Tur seçildiğinde önerileri getiren fonksiyon
  const fetchRecommendations = async (selectedTourId) => {
    try {
      if (selectedTourId) {
        const res = await API.get('/tours/most-popular'); // Bu rota arka uçta eklenmeli
        setRecommendedTours(res.data.filter(tour => tour._id !== selectedTourId));
      } else {
        setRecommendedTours([]);
      }
    } catch (err) {
      console.error('Failed to fetch tour recommendations:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'tourId') {
      fetchRecommendations(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Enhanced validation
    if (!form.name || !form.email || !form.tourId) {
      setError(t('messages.allFieldsRequired'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError(t('messages.invalidEmail'));
      return;
    }

    // Phone validation (optional but recommended)
    if (form.phone && form.phone.length < 10) {
      setError(t('messages.invalidPhone'));
      return;
    }

    // Name validation
    if (form.name.length < 2) {
      setError(t('messages.nameTooShort'));
      return;
    }

    // Guests validation
    if (form.guests < 1 || form.guests > 50) {
      setError(t('messages.invalidGuestCount'));
      return;
    }

    try {
      const res = await API.post('/bookings', form);
      
      if (form.paymentMethod === 'credit_card') {
        navigate('/payment', { state: { bookingId: res.data._id } });
      } else {
        setSuccess(t('messages.bookingCashSuccess'));
        setBookingConfirmed(true);
        
        // Calculate delay metrics after successful booking
        await calculateDelayMetrics(res.data._id);
        
        // Reset form
        setForm({ 
          name: '', 
          email: '', 
          phone: '',
          tourId: '', 
          paymentMethod: 'cash',
          guests: 1,
          date: '',
          pickupLocation: '',
          notes: ''
        });
        setRecommendedTours([]);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || t('messages.bookingFailed');
      setError(errorMsg);
    }
  };

  const calculateDelayMetrics = async (bookingId) => {
    setLoadingDelay(true);
    try {
      // Mock origin and destination - in production, get from form or tour details
      const response = await API.post('/delay/calculate', {
        bookingId,
        origin: 'Istanbul Airport',
        destination: 'Hotel in Sultanahmet'
      });
      
      setDelayMetrics(response.data);
    } catch (error) {
      console.error('Error calculating delay metrics:', error);
      // Don't show error to user - this is a nice-to-have feature
    } finally {
      setLoadingDelay(false);
    }
  };

  if (loadingTours) {
    return <Loading message={t('messages.loadingTours')} />;
  }

  return (
    <div className="flex flex-col md:flex-row p-4 max-w-6xl mx-auto space-y-4 md:space-y-0 md:space-x-8">
      <Helmet>
        <title>GNB Transfer | {t('header.booking')}</title>
        <meta name="description" content={t('messages.bookingDescription')} />
        <meta name="keywords" content={t('messages.bookingKeywords')} />
      </Helmet>

      <div className="flex-1 max-w-lg mx-auto md:mx-0">
        <h2 className="text-2xl font-bold mb-4">{t('header.booking')}</h2>
        {error && <ErrorMessage message={error} />}
        {success && <p className="text-green-500 mb-2">{success}</p>}
        
        {!bookingConfirmed ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('forms.fullName')} *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder={t('forms.fullName')}
                value={form.name}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('forms.email')} *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder={t('forms.email')}
                value={form.email}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('forms.phone')} {t('forms.optional')}
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder={t('forms.phonePlaceholder')}
                value={form.phone}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="tourId" className="block text-sm font-medium text-gray-700 mb-1">
                {t('forms.selectTour')} *
              </label>
              <select
                id="tourId"
                name="tourId"
                value={form.tourId}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('forms.selectTour')}</option>
                {tours.map((tour) => (
                  <option key={tour._id} value={tour._id}>
                    {tour.title} - ${tour.price}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
                {t('forms.guests')}
              </label>
              <input
                id="guests"
                type="number"
                name="guests"
                min="1"
                max="50"
                value={form.guests}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                {t('forms.date')} {t('forms.optional')}
              </label>
              <input
                id="date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700 mb-1">
                {t('forms.pickupLocation')} {t('forms.optional')}
              </label>
              <input
                id="pickupLocation"
                type="text"
                name="pickupLocation"
                placeholder={t('forms.pickupLocationPlaceholder')}
                value={form.pickupLocation}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                {t('forms.notes')} {t('forms.optional')}
              </label>
              <textarea
                id="notes"
                name="notes"
                placeholder={t('forms.notesPlaceholder')}
                value={form.notes}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="mb-2">
              <label htmlFor="paymentMethod" className="block text-gray-700 text-sm font-bold mb-2">
                {t('forms.paymentMethod')}
              </label>
              <select 
                id="paymentMethod"
                name="paymentMethod" 
                value={form.paymentMethod} 
                onChange={handleChange} 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cash">{t('forms.cash')}</option>
                <option value="credit_card">{t('forms.creditCard')}</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
            >
              {t('buttons.submit')}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-800 mb-2">
                {t('booking.confirmed', 'Booking Confirmed!')}
              </h3>
              <p className="text-green-700">{t('booking.thankYou', 'Thank you for your booking.')}</p>
            </div>
            
            {loadingDelay ? (
              <div className="text-center py-4">
                <Loading message={t('delay.calculating', 'Calculating delay guarantee...')} />
              </div>
            ) : delayMetrics ? (
              <DelayBadge
                delayRiskScore={delayMetrics.delayRiskScore}
                estimatedDelay={delayMetrics.estimatedDelay}
                discountCode={delayMetrics.discountCode}
              />
            ) : null}
            
            <button
              onClick={() => {
                setBookingConfirmed(false);
                setDelayMetrics(null);
                setSuccess('');
              }}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
            >
              {t('booking.newBooking', 'Make Another Booking')}
            </button>
          </div>
        )}
      </div>
      
      {recommendedTours.length > 0 && (
        <div className="flex-1 mt-8 md:mt-0 max-w-lg mx-auto md:mx-0">
          <h3 className="text-xl font-bold mb-4">{t('booking.recommendations')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {recommendedTours.map(tour => (
              <TourCard 
                key={tour._id} 
                tour={tour} 
                showPackageButton={!!user}
                userId={user?._id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Booking;