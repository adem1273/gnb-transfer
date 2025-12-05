import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { reviewImages } from '../config/images';

/**
 * TrustBadgesSection Component
 * Displays 5-star reviews with happy international family images
 */
function TrustBadgesSection({ reviews = [] }) {
  const { t } = useTranslation();

  // Sample reviews if none provided
  const defaultReviews = [
    {
      id: 1,
      name: 'Michael S.',
      location: 'Germany',
      rating: 5,
      comment:
        'Excellent service! The driver was professional and the vehicle was immaculate. Highly recommended for airport transfers.',
      imageIndex: 0,
    },
    {
      id: 2,
      name: 'Sarah L.',
      location: 'United Kingdom',
      rating: 5,
      comment:
        'We booked a family transfer and were impressed by the child seats provided. Safe and comfortable journey!',
      imageIndex: 1,
    },
    {
      id: 3,
      name: 'Yuki T.',
      location: 'Japan',
      rating: 5,
      comment:
        'The meet and greet service was fantastic. Our driver was waiting with a welcome sign right on time.',
      imageIndex: 2,
    },
    {
      id: 4,
      name: 'Carlos M.',
      location: 'Spain',
      rating: 5,
      comment:
        'Professional drivers, luxury vehicles, and great communication. Will definitely use again!',
      imageIndex: 3,
    },
    {
      id: 5,
      name: 'Elena R.',
      location: 'Russia',
      rating: 5,
      comment:
        'Perfect experience from booking to drop-off. The Mercedes Vito was spacious and comfortable.',
      imageIndex: 4,
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className="w-8 h-8 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.242 3.824a1 1 0 00.95.691h4.025c.969 0 1.371 1.24.588 1.81l-3.253 2.365a1 1 0 00-.362 1.118l1.242 3.824c.3.921-.755 1.688-1.54 1.118l-3.253-2.365a1 1 0 00-1.176 0l-3.253 2.365c-.784.57-1.838-.197-1.54-1.118l1.242-3.824a1 1 0 00-.362-1.118L3.257 9.252c-.783-.57-.38-1.81.588-1.81h4.025a1 1 0 00.95-.691l1.242-3.824z" />
              </svg>
            ))}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {t('reviews.title') || 'What Our Customers Say'}
          </h2>
          <p className="text-lg text-gray-600">
            4.9/5 {t('reviews.basedOn') || 'based on'} 500+{' '}
            {t('reviews.verifiedReviews') || 'verified reviews'}
          </p>
        </motion.div>

        {/* Reviews Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {displayReviews.slice(0, 3).map((review, index) => (
            <motion.div
              key={review.id || index}
              className="bg-gray-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              variants={fadeInUp}
              whileHover={{ y: -5 }}
            >
              {/* Review Image */}
              <div className="h-48 overflow-hidden">
                {reviewImages[review.imageIndex || index] && (
                  <picture>
                    <source
                      type="image/webp"
                      srcSet={reviewImages[review.imageIndex || index].webp}
                    />
                    <img
                      src={reviewImages[review.imageIndex || index].src}
                      srcSet={reviewImages[review.imageIndex || index].srcSet}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      alt={t(reviewImages[review.imageIndex || index].altKey)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </picture>
                )}
              </div>

              {/* Review Content */}
              <div className="p-6">
                {/* Stars */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(review.rating || 5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.242 3.824a1 1 0 00.95.691h4.025c.969 0 1.371 1.24.588 1.81l-3.253 2.365a1 1 0 00-.362 1.118l1.242 3.824c.3.921-.755 1.688-1.54 1.118l-3.253-2.365a1 1 0 00-1.176 0l-3.253 2.365c-.784.57-1.838-.197-1.54-1.118l1.242-3.824a1 1 0 00-.362-1.118L3.257 9.252c-.783-.57-.38-1.81.588-1.81h4.025a1 1 0 00.95-.691l1.242-3.824z" />
                    </svg>
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-700 italic mb-4 line-clamp-3">"{review.comment}"</p>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{review.name}</p>
                    <p className="text-sm text-gray-500">{review.location}</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t('reviews.verified') || 'Verified'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
            <p className="text-gray-600">{t('reviews.happyCustomers') || 'Happy Customers'}</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-blue-600 mb-2">4.9★</div>
            <p className="text-gray-600">{t('reviews.averageRating') || 'Average Rating'}</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-blue-600 mb-2">99%</div>
            <p className="text-gray-600">{t('reviews.onTimePickup') || 'On-time Pickup'}</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
            <p className="text-gray-600">{t('reviews.support') || 'Customer Support'}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default TrustBadgesSection;
