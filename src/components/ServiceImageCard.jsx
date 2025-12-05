import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { serviceImages } from '../config/images';

/**
 * ServiceImageCard Component
 * Displays service images with checkboxes for booking extras
 */
function ServiceImageCard({ serviceKey, isSelected, onToggle, price = 0, showPrice = true }) {
  const { t } = useTranslation();
  const image = serviceImages[serviceKey];

  if (!image) return null;

  const serviceNames = {
    childSeat: t('booking.childSeat') || 'Child Seat',
    babySeat: t('booking.babySeat') || 'Baby Seat',
    meetAndGreet: t('booking.meetAndGreet') || 'Meet & Greet',
    vipLounge: t('booking.vipLounge') || 'VIP Lounge Access',
    nameSign: t('booking.nameSign') || 'Welcome Sign',
  };

  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-lg'
          : 'border border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
      onClick={onToggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image */}
      <div className="aspect-video relative overflow-hidden">
        <picture>
          <source type="image/webp" srcSet={image.webp} />
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes="(max-width: 768px) 100vw, 50vw"
            alt={t(image.altKey)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </picture>

        {/* Overlay */}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isSelected ? 'bg-blue-600/20' : 'bg-black/0 hover:bg-black/10'
          }`}
        />

        {/* Checkbox */}
        <div
          className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSelected ? 'bg-blue-600 text-white' : 'bg-white/80 border border-gray-300'
          }`}
        >
          {isSelected && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white">
        <h4 className="font-semibold text-gray-800 mb-1">{serviceNames[serviceKey]}</h4>
        {showPrice && price > 0 && (
          <p className="text-blue-600 font-medium">+${price.toFixed(2)}</p>
        )}
        {showPrice && price === 0 && (
          <p className="text-green-600 font-medium text-sm">{t('booking.free') || 'Free'}</p>
        )}
      </div>
    </motion.div>
  );
}

/**
 * ExtraServicesSection Component
 * Grid layout for all extra services with images
 */
export function ExtraServicesSection({ selectedServices = {}, onServiceToggle, prices = {} }) {
  const { t } = useTranslation();

  const services = [
    { key: 'childSeat', defaultPrice: 10 },
    { key: 'babySeat', defaultPrice: 10 },
    { key: 'meetAndGreet', defaultPrice: 15 },
    { key: 'vipLounge', defaultPrice: 50 },
    { key: 'nameSign', defaultPrice: 0 },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        {t('booking.extraServices') || 'Extra Services'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <ServiceImageCard
            key={service.key}
            serviceKey={service.key}
            isSelected={selectedServices[service.key] || false}
            onToggle={() => onServiceToggle(service.key)}
            price={prices[service.key] ?? service.defaultPrice}
          />
        ))}
      </div>
    </div>
  );
}

export default ServiceImageCard;
