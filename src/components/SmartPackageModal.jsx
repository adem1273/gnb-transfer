/**
 * SmartPackageModal Component
 * Modal for displaying AI-generated package recommendations
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

function SmartPackageModal({ isOpen, onClose, packageData, onAccept }) {
  const { t } = useTranslation();

  if (!isOpen || !packageData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {t('package.smartBundle', '🎁 Smart Package for You')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Package Details */}
          <div className="space-y-4">
            {/* Recommended Tour */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">
                {t('package.recommendedTour', 'Recommended Tour')}
              </h3>
              <p className="text-xl font-bold text-blue-700">{packageData.recommendedTour}</p>
            </div>

            {/* AI Reasoning */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-600 mb-2">
                {t('package.whyThisTour', 'Why this tour?')}
              </h3>
              <p className="text-gray-700">{packageData.reasoning}</p>
            </div>

            {/* Pricing */}
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">
                  {t('package.bundlePrice', 'Bundle Price')}:
                </span>
                <div className="text-right">
                  {packageData.originalPrice && (
                    <span className="text-gray-500 line-through text-sm mr-2">
                      ${packageData.originalPrice}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-green-600">
                    ${packageData.bundlePrice}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('package.savings', 'Your Savings')}:
                </span>
                <span className="text-lg font-bold text-green-700">
                  {packageData.discount}% OFF
                </span>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="mr-2">✨</span>
                {t('package.packageIncludes', 'Package Includes')}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>{t('package.transfer', 'Airport Transfer')}</li>
                <li>{t('package.selectedTour', 'Selected Tour Experience')}</li>
                <li>{t('package.autoDiscount', 'Automatic 15% Discount Applied')}</li>
                <li>{t('package.prioritySupport', 'Priority Customer Support')}</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onAccept && onAccept(packageData)}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {t('package.bookNow', 'Book This Package')}
            </button>
            <button
              onClick={onClose}
              className="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              {t('package.notNow', 'Not Now')}
            </button>
          </div>

          {/* AI Badge */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              <span className="font-semibold">🤖 {t('package.aiPowered', 'AI-Powered')}</span> -
              {t('package.personalizedMessage', ' Personalized based on your preferences')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SmartPackageModal;
