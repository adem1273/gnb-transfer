import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useTranslation } from 'react-i18next';
import TourCard from '../components/TourCard'; // TourCard bileşenini dahil et
import DelayBadge from '../components/DelayBadge';

function Booking() {
  const [form, setForm] = useState({ name: '', email: '', tourId: '', paymentMethod: 'cash' });
  const [tours, setTours] = useState([]);
  const [recommendedTours, setRecommendedTours] = useState([]); // Yeni state: Önerilen turlar
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingTours, setLoadingTours] = useState(true);
  const [completedBookingId, setCompletedBookingId] = useState(null); // Track completed booking
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    if (!form.name || !form.email || !form.tourId) {
      setError(t('messages.allFieldsRequired'));
      setSuccess('');
      return;
    }

    try {
      const res = await API.post('/bookings', form);
      
      if (form.paymentMethod === 'credit_card') {
        navigate('/payment', { state: { bookingId: res.data._id } });
      } else {
        setSuccess(t('messages.bookingCashSuccess'));
        setError('');
        setCompletedBookingId(res.data._id); // Set completed booking ID to show DelayBadge
        setForm({ name: '', email: '', tourId: '', paymentMethod: 'cash' });
        setRecommendedTours([]);
      }
    } catch (err) {
      console.error(err);
      setError(t('messages.bookingFailed'));
      setSuccess('');
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
        
        {/* Show Delay Badge after successful booking */}
        {completedBookingId && (
          <div className="mb-4">
            <DelayBadge 
              bookingId={completedBookingId}
            />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder={t('forms.fullName')}
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          <input
            type="email"
            name="email"
            placeholder={t('forms.email')}
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          <select
            name="tourId"
            value={form.tourId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">{t('forms.selectTour')}</option>
            {tours.map((tour) => (
              <option key={tour._id} value={tour._id}>
                {tour.title}
              </option>
            ))}
          </select>
          
          <div className="mb-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t('forms.paymentMethod')}
            </label>
            <select 
              name="paymentMethod" 
              value={form.paymentMethod} 
              onChange={handleChange} 
              className="w-full p-2 border rounded"
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
      </div>
      
      {recommendedTours.length > 0 && (
        <div className="flex-1 mt-8 md:mt-0 max-w-lg mx-auto md:mx-0">
          <h3 className="text-xl font-bold mb-4">{t('booking.recommendations')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {recommendedTours.map(tour => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Booking;