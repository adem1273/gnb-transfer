import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import SmartPackageModal from './SmartPackageModal';
import API from '../utils/api';

function TourCard({ tour, showPackageButton = false, userId = null }) {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [packageData, setPackageData] = useState(null);
    const [loadingPackage, setLoadingPackage] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

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

    // Get image or use placeholder
    const imageUrl = tour.image || tour.imageUrl || `https://via.placeholder.com/400x250?text=${encodeURIComponent(getTranslatedTitle(tour))}`;

    return (
        <>
            <motion.div 
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300 border border-gray-100 h-full flex flex-col"
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                {/* Image Section */}
                <div className="relative h-48 md:h-56 bg-gray-200 overflow-hidden">
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-pulse w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                        </div>
                    )}
                    <img 
                        src={imageUrl}
                        alt={getTranslatedTitle(tour)}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        loading="lazy"
                    />
                    
                    {/* Campaign Badge */}
                    {tour.isCampaign && tour.discount > 0 && (
                        <motion.div 
                            className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", delay: 0.2 }}
                        >
                            {tour.discount}% OFF
                        </motion.div>
                    )}

                    {/* Featured Badge */}
                    {tour.isFeatured && (
                        <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                            <span>⭐</span>
                            {t('tourCard.featured') || 'Featured'}
                        </div>
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content Section */}
                <div className="p-5 flex-grow flex flex-col">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                        {getTranslatedTitle(tour)}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                        {getTranslatedDescription(tour)}
                    </p>

                    {/* Features */}
                    {tour.duration && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{tour.duration}</span>
                        </div>
                    )}

                    {/* Price Section */}
                    <div className="border-t border-gray-100 pt-4 mt-auto">
                        {tour.isCampaign && tour.discount > 0 ? (
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-gray-400 line-through text-sm">${tour.price}</span>
                                <span className="text-2xl font-bold text-red-600">${discountedPrice.toFixed(2)}</span>
                            </div>
                        ) : (
                            <div className="text-2xl font-bold text-blue-600 mb-2">
                                ${tour.price}
                            </div>
                        )}
                        
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t('tourCard.noHiddenFees') || 'No hidden fees'}
                        </p>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <motion.button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {t('tourCard.bookNow') || 'Book Now'}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </motion.button>

                            {showPackageButton && (
                                <motion.button
                                    onClick={handleCreatePackage}
                                    disabled={loadingPackage}
                                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span>🎁</span>
                                    {loadingPackage 
                                        ? t('package.creating', 'Creating...')
                                        : t('package.createPackage', 'Create Package')
                                    }
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

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