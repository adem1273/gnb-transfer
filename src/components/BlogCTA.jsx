import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Call-to-Action Component for Blog Posts
 * Encourages readers to book a tour or transfer
 */
function BlogCTA({ variant = 'default', className = '' }) {
  const { t } = useTranslation();

  const variants = {
    default: {
      bg: 'bg-gradient-to-r from-blue-600 to-blue-800',
      title: t('blog.cta.default.title') || 'Ready to Book Your Transfer?',
      description: t('blog.cta.default.description') || 'Experience premium comfort and reliability with our professional transfer services.',
      buttonText: t('blog.cta.default.button') || 'Book Now',
      buttonLink: '/booking',
    },
    tours: {
      bg: 'bg-gradient-to-r from-green-600 to-green-800',
      title: t('blog.cta.tours.title') || 'Explore Our Tours',
      description: t('blog.cta.tours.description') || 'Discover amazing destinations with our guided tours and excursions.',
      buttonText: t('blog.cta.tours.button') || 'View Tours',
      buttonLink: '/tours',
    },
    contact: {
      bg: 'bg-gradient-to-r from-purple-600 to-purple-800',
      title: t('blog.cta.contact.title') || 'Have Questions?',
      description: t('blog.cta.contact.description') || 'Our team is here to help you plan the perfect trip. Get in touch today!',
      buttonText: t('blog.cta.contact.button') || 'Contact Us',
      buttonLink: '/contact',
    },
  };

  const cta = variants[variant] || variants.default;

  return (
    <div className={`${cta.bg} text-white rounded-xl p-8 my-8 shadow-lg ${className}`}>
      <div className="max-w-3xl mx-auto text-center">
        <h3 className="text-2xl md:text-3xl font-bold mb-4">
          {cta.title}
        </h3>
        <p className="text-lg mb-6 opacity-90">
          {cta.description}
        </p>
        <Link
          to={cta.buttonLink}
          className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
        >
          {cta.buttonText}
        </Link>
      </div>
    </div>
  );
}

export default BlogCTA;
