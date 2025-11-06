import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SmartPackageModal from './SmartPackageModal';
import API from '../utils/api';

function TourCard({ tour, showPackageButton = false, userId = null }) {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [packageData, setPackageData] = useState(null);
    const [loadingPackage, setLoadingPackage] = useState(false);

    const getDiscountedPrice = (price, discount) => {
        if (discount <= 0 || discount >= 100) return price;
        return price - (price * discount / 100);
    };

    const getTranslatedTitle = (tour) => {
        const langKey = `title_${currentLang}`;
        return tour[langKey] || tour.title;
    };

    const getTranslatedDescription = (tour) => {
        const langKey = `description_${currentLang}`;
        return tour[langKey] || tour.description;
    };

    const handleCreatePackage = async () => {
        if (!userId) {
            alert(t('package.loginRequired', 'Please login to create a package'));
            return;
        }

        setLoadingPackage(true);
        try {
            const response = await API.post('/packages/recommend', { userId });
            setPackageData(response.data);
            setShowPackageModal(true);
        } catch (error) {
            alert(t('package.error', 'Failed to create package. Please try again.'));
        } finally {
            setLoadingPackage(false);
        }
    };

    const handleAcceptPackage = (packageData) => {
        // In production, this would navigate to booking with the package
        alert(t('package.bookingRedirect', 'Redirecting to booking...'));
        setShowPackageModal(false);
    };

    const discountedPrice = getDiscountedPrice(tour.price, tour.discount);

    return (
        <>
            <div className="border rounded-lg p-4 shadow hover:shadow-lg transition relative">
                {tour.isCampaign && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {t('tourCard.onSale')}
                    </div>
                )}
                <h2 className="text-xl font-bold mt-4">{getTranslatedTitle(tour)}</h2>
                <p>{getTranslatedDescription(tour)}</p>
                <div className="mt-2">
                    {tour.isCampaign && tour.discount > 0 ? (
                        <div className="flex items-center gap-2">
                            <p className="text-gray-500 line-through">${tour.price}</p>
                            <p className="font-semibold text-lg text-red-600">${discountedPrice}</p>
                            <span className="text-green-600 text-sm font-bold">({tour.discount}% OFF)</span>
                        </div>
                    ) : (
                        <p className="font-semibold mt-2">${tour.price}</p>
                    )}
                </div>
                <p className="text-sm text-green-600 mt-2 font-medium">
                    {t('tourCard.noHiddenFees')}
                </p>

                {showPackageButton && (
                    <button
                        onClick={handleCreatePackage}
                        disabled={loadingPackage}
                        className="mt-4 w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span>🎁</span>
                        {loadingPackage 
                            ? t('package.creating', 'Creating...')
                            : t('package.createPackage', 'Create Your Package')
                        }
                    </button>
                )}
            </div>

            <SmartPackageModal
                isOpen={showPackageModal}
                onClose={() => setShowPackageModal(false)}
                packageData={packageData}
                onAccept={handleAcceptPackage}
            />
        </>
    );
}

export default TourCard;