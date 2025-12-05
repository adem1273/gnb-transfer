import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { fleetImages } from '../config/images';
import OptimizedImage from './OptimizedImage';

/**
 * FleetSection Component
 * Displays 12 vehicle photos (exterior + interior)
 * Features: Tabbed gallery, responsive grid, lazy loading
 */
function FleetSection() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('exterior');
  const [selectedImage, setSelectedImage] = useState(null);

  // Filter images by category
  const exteriorImages = fleetImages.filter((img) => img.category === 'fleet');
  const interiorImages = fleetImages.filter(
    (img) => img.category === 'fleet-interior' || img.category === 'fleet-trunk'
  );

  const currentImages = activeTab === 'exterior' ? exteriorImages : interiorImages;

  // Vehicle info cards
  const vehicles = [
    {
      name: t('fleet.mercedesVito') || 'Mercedes Vito',
      passengers: '1-7',
      luggage: '5-7',
      features: ['leather', 'ac', 'wifi', 'usb', 'water'],
    },
    {
      name: t('fleet.mercedesViano') || 'Mercedes Viano',
      passengers: '1-7',
      luggage: '5-7',
      features: ['leather', 'ac', 'wifi', 'usb', 'water'],
    },
    {
      name: t('fleet.mercedesSprinter') || 'Mercedes Sprinter',
      passengers: '1-16',
      luggage: '16+',
      features: ['leather', 'ac', 'wifi', 'usb', 'water'],
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {t('fleet.title') || 'Our Premium Fleet'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('fleet.subtitle') || 'Luxury vehicles for every occasion'}
          </p>
        </motion.div>

        {/* Vehicle Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {vehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.name}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              {/* Vehicle Image */}
              <div className="h-48 bg-gray-200 overflow-hidden">
                {exteriorImages[index * 2] && (
                  <picture>
                    <source type="image/webp" srcSet={exteriorImages[index * 2].webp} />
                    <img
                      src={exteriorImages[index * 2].src}
                      srcSet={exteriorImages[index * 2].srcSet}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      alt={t(exteriorImages[index * 2].altKey)}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </picture>
                )}
              </div>

              {/* Vehicle Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">{vehicle.name}</h3>

                <div className="flex gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>
                      {vehicle.passengers} {t('fleet.passengers') || 'passengers'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <span>
                      {vehicle.luggage} {t('fleet.luggage') || 'luggage'}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                    >
                      {t(`fleet.features.${feature}`) || feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gallery Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('exterior')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'exterior'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('fleet.exteriorGallery') || 'Exterior Gallery'}
          </button>
          <button
            onClick={() => setActiveTab('interior')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'interior'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('fleet.interiorGallery') || 'Interior Gallery'}
          </button>
        </div>

        {/* Image Gallery Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {currentImages.map((image, index) => (
            <motion.div
              key={image.id}
              className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              onClick={() => setSelectedImage(image)}
            >
              <picture>
                <source type="image/webp" srcSet={image.webp} />
                <img
                  src={image.src}
                  srcSet={image.srcSet}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  alt={t(image.altKey)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </picture>
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </div>
              {/* Vehicle Type Badge */}
              {image.vehicleType && (
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  {image.vehicleType}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Lightbox Modal */}
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <picture>
                <source type="image/webp" srcSet={selectedImage.webp} />
                <img
                  src={selectedImage.src}
                  alt={t(selectedImage.altKey)}
                  className="max-w-full max-h-[85vh] rounded-lg object-contain"
                />
              </picture>
              <p className="text-white text-center mt-4">{t(selectedImage.altKey)}</p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default FleetSection;
