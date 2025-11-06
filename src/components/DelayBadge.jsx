import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';

/**
 * DelayBadge Component
 * Displays the Delay Guarantee Score and potential discount information
 */
function DelayBadge({ bookingId, origin, destination }) {
  const { t } = useTranslation();
  const [delayData, setDelayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDelayGuarantee = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Build query params for origin/destination if provided
        const params = new URLSearchParams();
        if (origin) params.append('origin', origin);
        if (destination) params.append('destination', destination);
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await API.get(`/delay/calculate/${bookingId}${queryString}`);
        
        if (response.data && response.data.data) {
          setDelayData(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching delay guarantee:', err);
        setError(err.response?.data?.error || 'Failed to load delay guarantee');
      } finally {
        setLoading(false);
      }
    };

    fetchDelayGuarantee();
  }, [bookingId, origin, destination]);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-blue-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !delayData) {
    return null; // Silently fail - don't show error to user
  }

  // Determine badge color based on risk score
  const getBadgeColor = (score) => {
    if (score < 30) return 'green';
    if (score < 60) return 'yellow';
    return 'red';
  };

  // Determine guarantee level based on risk score
  const getGuaranteeLevel = (score) => {
    if (score < 30) return t('delayBadge.excellent');
    if (score < 60) return t('delayBadge.good');
    return t('delayBadge.moderate');
  };

  const badgeColor = getBadgeColor(delayData.delayRiskScore);
  const guaranteeLevel = getGuaranteeLevel(delayData.delayRiskScore);

  const colorClasses = {
    green: 'bg-green-50 border-green-300 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    red: 'bg-red-50 border-red-300 text-red-800'
  };

  const iconClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600'
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${colorClasses[badgeColor]} transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className={`w-6 h-6 ${iconClasses[badgeColor]}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-bold">
              {t('delayBadge.title')}
            </h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('delayBadge.riskScore')}:
              </span>
              <span className="text-2xl font-bold">
                {delayData.delayRiskScore}/100
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('delayBadge.guaranteeLevel')}:
              </span>
              <span className="text-sm font-bold">
                {guaranteeLevel}
              </span>
            </div>
            
            {delayData.estimatedDelayMinutes > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('delayBadge.estimatedDelay')}:
                </span>
                <span className="text-sm font-bold">
                  ~{delayData.estimatedDelayMinutes} {t('delayBadge.minutes')}
                </span>
              </div>
            )}
            
            {delayData.route && (
              <div className="mt-2 pt-2 border-t border-current/20">
                <p className="text-xs opacity-75">
                  {t('delayBadge.route')}: {delayData.route.origin} → {delayData.route.destination}
                </p>
                <p className="text-xs opacity-75">
                  {t('delayBadge.distance')}: {delayData.route.distance} km | 
                  {t('delayBadge.duration')}: ~{delayData.route.estimatedDuration} {t('delayBadge.minutes')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Discount notification */}
      {delayData.discountGenerated && delayData.discountCode && (
        <div className="mt-4 pt-4 border-t border-current/30">
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-bold text-green-800">
                {t('delayBadge.discountEarned')}
              </span>
            </div>
            <div className="bg-white rounded border-2 border-dashed border-green-400 p-2 text-center">
              <p className="text-xs text-gray-600 mb-1">
                {t('delayBadge.discountCode')}:
              </p>
              <p className="text-lg font-mono font-bold text-green-700">
                {delayData.discountCode}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {t('delayBadge.save')} ${delayData.discountAmount.toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              {t('delayBadge.useNextBooking')}
            </p>
          </div>
        </div>
      )}
      
      {/* Info message */}
      <div className="mt-3 text-xs opacity-75">
        <p>{t('delayBadge.infoMessage')}</p>
      </div>
    </div>
  );
}

export default DelayBadge;
