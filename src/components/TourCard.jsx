import React from 'react';
import { useTranslation } from 'react-i18next';

function TourCard({ tour }) {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

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

    const discountedPrice = getDiscountedPrice(tour.price, tour.discount);

    return (
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
        </div>
    );
}

export default TourCard;