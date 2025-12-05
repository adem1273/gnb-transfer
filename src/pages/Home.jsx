import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import TrustBadge from '../components/TrustBadge';
import TourCard from '../components/TourCard';
import HeroSlider from '../components/HeroSlider';
import FleetSection from '../components/FleetSection';
import TrustBadgesSection from '../components/TrustBadgesSection';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import { servicesPageImages } from '../config/images';

function Home() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [campaignTours, setCampaignTours] = useState([]);
  const [popularTours, setPopularTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentLang = i18n.language;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reviewsRes = await API.get('/reviews/featured');
        setFeaturedReviews(reviewsRes.data);

        const toursRes = await API.get('/tours/campaigns');
        setCampaignTours(toursRes.data);

        const popularToursRes = await API.get('/tours/most-popular');
        setPopularTours(popularToursRes.data);

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load content. Please try again later.');
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const getTranslatedTitle = (item) => {
    const langKey = `title_${currentLang}`;
    return item[langKey] || item.title;
  };

  const getTranslatedDescription = (item) => {
    const langKey = `description_${currentLang}`;
    return item[langKey] || item.description;
  };

  if (loading) {
    return <Loading message="Loading home page content..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>GNB Transfer | {t('header.home')}</title>
        <meta name="description" content={t('home.slogan')} />
        <meta property="og:title" content="GNB Transfer - Premium Tourism & Transfer Services" />
        <meta property="og:description" content={t('home.slogan')} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Hero Slider with Luxury Van Images */}
      <HeroSlider />

      {/* Why Choose Us Section */}
      <motion.section
        className="py-16 md:py-24 bg-gray-100"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12"
            variants={fadeInUp}
          >
            {t('home.whyChooseUsTitle')}
          </motion.h2>
          <motion.div className="grid md:grid-cols-3 gap-8" variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <TrustBadge
                title={t('home.trustBadge1Title')}
                description={t('home.trustBadge1Desc')}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <TrustBadge
                title={t('home.trustBadge2Title')}
                description={t('home.trustBadge2Desc')}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <TrustBadge
                title={t('home.trustBadge3Title')}
                description={t('home.trustBadge3Desc')}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Services Section with Images */}
      <motion.section
        className="py-16 md:py-24 bg-white"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12"
            variants={fadeInUp}
          >
            {t('home.servicesTitle')}
          </motion.h2>
          <motion.div className="grid md:grid-cols-3 gap-8" variants={staggerContainer}>
            <motion.div
              className="rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white overflow-hidden"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="h-48 overflow-hidden">
                <picture>
                  <source type="image/webp" srcSet={servicesPageImages.airportTransfer.webp} />
                  <img
                    src={servicesPageImages.airportTransfer.src}
                    srcSet={servicesPageImages.airportTransfer.srcSet}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    alt={t(servicesPageImages.airportTransfer.altKey)}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </picture>
              </div>
              <div className="p-6">
                <div className="text-3xl mb-3">✈️</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">
                  {t('services.airportTransfer.title') || 'Istanbul Airport Transfer'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('services.airportTransfer.description') ||
                    'Fast and safe airport transfer service in Istanbul.'}
                </p>
              </div>
            </motion.div>
            <motion.div
              className="rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white overflow-hidden"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="h-48 overflow-hidden">
                <picture>
                  <source type="image/webp" srcSet={servicesPageImages.cityTours.webp} />
                  <img
                    src={servicesPageImages.cityTours.src}
                    srcSet={servicesPageImages.cityTours.srcSet}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    alt={t(servicesPageImages.cityTours.altKey)}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </picture>
              </div>
              <div className="p-6">
                <div className="text-3xl mb-3">🏛️</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">
                  {t('services.cityTours.title') || 'City Tours'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('services.cityTours.description') ||
                    'Discover the beauty of Istanbul with our guided tours.'}
                </p>
              </div>
            </motion.div>
            <motion.div
              className="rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white overflow-hidden"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="h-48 overflow-hidden">
                <picture>
                  <source type="image/webp" srcSet={servicesPageImages.privateCharter.webp} />
                  <img
                    src={servicesPageImages.privateCharter.src}
                    srcSet={servicesPageImages.privateCharter.srcSet}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    alt={t(servicesPageImages.privateCharter.altKey)}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </picture>
              </div>
              <div className="p-6">
                <div className="text-3xl mb-3">🚐</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">
                  {t('services.privateCharter.title') || 'Private Charter'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('services.privateCharter.description') ||
                    'Exclusive vehicle hire for special occasions.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Fleet Section */}
      <FleetSection />

      {/* Popular Tours Section */}
      {popularTours.length > 0 && (
        <motion.section
          className="py-16 md:py-24 bg-gray-50"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-4">
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-center text-blue-600 mb-12"
              variants={fadeInUp}
            >
              {t('home.mostPopularToursTitle')}
            </motion.h2>
            <motion.div className="grid md:grid-cols-3 gap-8" variants={staggerContainer}>
              {popularTours.map((tour) => (
                <motion.div key={tour._id} variants={fadeInUp}>
                  <TourCard tour={tour} showPackageButton={!!user} userId={user?._id} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Campaign Tours Section */}
      {campaignTours.length > 0 && (
        <motion.section
          className="py-16 md:py-24 bg-gradient-to-br from-red-50 to-orange-50"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-4">
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <span className="inline-block bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                🔥 {t('home.specialOffers') || 'Special Offers'}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-red-600">
                {t('home.campaignsTitle')}
              </h2>
            </motion.div>
            <motion.div className="grid md:grid-cols-3 gap-8" variants={staggerContainer}>
              {campaignTours.map((tour) => (
                <motion.div key={tour._id} variants={fadeInUp}>
                  <TourCard tour={tour} showPackageButton={!!user} userId={user?._id} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Reviews Section with Images */}
      <TrustBadgesSection reviews={featuredReviews} />
    </div>
  );
}

export default Home;
