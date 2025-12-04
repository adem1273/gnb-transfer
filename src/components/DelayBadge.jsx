/**
 * DelayBadge Component
 * Displays the delay guarantee score and information
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

function DelayBadge({ delayRiskScore, estimatedDelay, discountCode }) {
  const { t } = useTranslation();

  // Determine badge color based on risk score
  const getBadgeColor = () => {
    if (delayRiskScore < 30) return 'bg-green-500';
    if (delayRiskScore < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get risk level text
  const getRiskLevel = () => {
    if (delayRiskScore < 30) return t('delay.lowRisk', 'Low Risk');
    if (delayRiskScore < 60) return t('delay.mediumRisk', 'Medium Risk');
    return t('delay.highRisk', 'High Risk');
  };

  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">
          {t('delay.guarantee', 'Delay Guarantee')}
        </h3>
        <div className={`${getBadgeColor()} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
          {getRiskLevel()}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{t('delay.riskScore', 'Risk Score')}:</span>
          <span className="font-bold text-lg">{delayRiskScore}/100</span>
        </div>

        {estimatedDelay > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t('delay.estimatedDelay', 'Estimated Delay')}:</span>
            <span className="font-bold text-orange-600">{estimatedDelay} {t('delay.minutes', 'min')}</span>
          </div>
        )}

        {discountCode && (
          <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded">
            <p className="text-sm font-semibold text-green-800 mb-1">
              {t('delay.discountEarned', 'Discount Earned!')}
            </p>
            <div className="flex items-center justify-between">
              <code className="bg-white px-2 py-1 rounded text-green-700 font-mono text-sm">
                {discountCode}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(discountCode)}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              >
                {t('delay.copy', 'Copy')}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {t('delay.discountInfo', 'Use this code for your next booking due to potential delay')}
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {t('delay.guaranteeInfo', 'Our delay guarantee ensures you receive compensation if your transfer is delayed more than 15 minutes.')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DelayBadge;
