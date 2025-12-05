import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useTranslation } from 'react-i18next';

function Feedback() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [formData, setFormData] = useState({ name: '', comment: '', rating: 5 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await API.get('/reviews');
        setReviews(res.data);
      } catch (err) {
        setError('Failed to load reviews.');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await API.post('/reviews', formData);
      setReviews([...reviews, res.data]);
      setFormData({ name: '', comment: '', rating: 5 });
    } catch (err) {
      setError('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 p-4 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center">{t('reviews.title')}</h2>

      {/* Geri Bildirim Formu */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h3 className="text-2xl font-semibold mb-4">{t('reviews.leaveReviewTitle')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder={t('reviews.namePlaceholder')}
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          <textarea
            name="comment"
            placeholder={t('reviews.commentPlaceholder')}
            value={formData.comment}
            onChange={handleChange}
            rows="4"
            className="w-full p-2 border rounded"
          />
          <div className="flex items-center space-x-2">
            <label>{t('reviews.ratingLabel')}:</label>
            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              className="p-2 border rounded"
            >
              {[1, 2, 3, 4, 5].map((rate) => (
                <option key={rate} value={rate}>
                  {rate}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            disabled={submitting}
          >
            {submitting ? t('buttons.submitting') : t('buttons.submitReview')}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>

      {/* Yorumlar Listesi */}
      <h3 className="text-2xl font-semibold mb-4">{t('reviews.allReviewsTitle')}</h3>
      {loading ? (
        <p>{t('reviews.loading')}</p>
      ) : (
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review._id} className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold">{review.name}</p>
                <div className="flex items-center text-yellow-500 my-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.242 3.824a1 1 0 00.95.691h4.025c.969 0 1.371 1.24.588 1.81l-3.253 2.365a1 1 0 00-.362 1.118l1.242 3.824c.3.921-.755 1.688-1.54 1.118l-3.253-2.365a1 1 0 00-1.176 0l-3.253 2.365c-.784.57-1.838-.197-1.54-1.118l1.242-3.824a1 1 0 00-.362-1.118L3.257 9.252c-.783-.57-.38-1.81.588-1.81h4.025a1 1 0 00.95-.691l1.242-3.824z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700">{review.comment}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p>{t('reviews.noReviews')}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Feedback;
