import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

/**
 * PackageModal Component
 * Displays AI-generated package recommendations with 15% discount
 */
function PackageModal({ tourId, onClose }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use smart package for authenticated users, generic for others
        let response;
        if (user) {
          response = await API.post('/packages/create', { currentTourId: tourId });
        } else {
          response = await API.post('/packages/generic', { currentTourId: tourId });
        }

        if (response.data && response.data.data) {
          setPackageData(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching package:', err);
        setError(err.response?.data?.error || 'Failed to load package recommendation');
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [tourId, user]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <h2 className="text-2xl font-bold">{t('packageModal.title')}</h2>
              </div>
              <p className="text-purple-100 text-sm">
                {user ? t('packageModal.personalizedDesc') : t('packageModal.genericDesc')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
              <p className="text-gray-600">{t('packageModal.generating')}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700"
              >
                {t('buttons.close')}
              </button>
            </div>
          )}

          {!loading && !error && packageData && (
            <div className="space-y-6">
              {/* Package Title & Description */}
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-3">{packageData.title}</h3>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">{packageData.description}</p>
              </div>

              {/* Highlights */}
              {packageData.highlights && packageData.highlights.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t('packageModal.highlights')}
                  </h4>
                  <ul className="space-y-2">
                    {packageData.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tours in Package */}
              <div>
                <h4 className="font-bold text-gray-900 text-xl mb-4">
                  {t('packageModal.includedTours')} ({packageData.tours.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packageData.tours.map((tour, index) => (
                    <div
                      key={tour.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-400 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-gray-900 flex-1">
                          {index + 1}. {tour.title}
                        </h5>
                        <span className="text-gray-600 font-medium">${tour.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{tour.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>{t('packageModal.originalPrice')}:</span>
                    <span className="line-through text-lg">
                      ${packageData.pricing.originalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600 font-semibold">
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('packageModal.packageDiscount')} ({packageData.pricing.discountPercentage}
                      %):
                    </span>
                    <span>-${packageData.pricing.discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-green-300 pt-3 flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {t('packageModal.totalPrice')}:
                    </span>
                    <span className="text-3xl font-bold text-green-600">
                      ${packageData.pricing.finalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white bg-opacity-70 rounded-lg p-3 text-center">
                    <p className="text-sm font-semibold text-green-700">
                      {t('packageModal.saveAmount', {
                        amount: packageData.pricing.discountAmount.toFixed(2),
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  {t('buttons.close')}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold flex items-center justify-center gap-2"
                  title={t('packageModal.bookingComingSoon')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {t('packageModal.bookPackage')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PackageModal;
