import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import TrustBadge from '../components/TrustBadge';
import TourCard from '../components/TourCard';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

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
        console.error("Failed to fetch data:", err);
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
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('home.welcome')}
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl mb-8 text-blue-100"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t('home.slogan')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/booking">
                <motion.button
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('home.bookNow')}
                </motion.button>
              </Link>
              <Link to="/tours">
                <motion.button
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('home.exploreTours') || 'Explore Tours'}
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" fill="#f3f4f6"/>
          </svg>
        </div>
      </section>

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
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
          >
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
      
      {/* Services Section */}
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
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
          >
            <motion.div 
              className="p-8 border border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Istanbul Airport Transfer</h3>
              <p className="text-gray-600">Fast and safe airport transfer service in Istanbul.</p>
            </motion.div>
            <motion.div 
              className="p-8 border border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="text-4xl mb-4">⛷️</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Bursa & Uludağ Tours</h3>
              <p className="text-gray-600">Discover the beauty of Bursa and ski in Uludağ with our guided tours.</p>
            </motion.div>
            <motion.div 
              className="p-8 border border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Pamukkale & Trabzon Tours</h3>
              <p className="text-gray-600">Explore the natural wonders and historic sites in Turkey.</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

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
            <motion.div 
              className="grid md:grid-cols-3 gap-8"
              variants={staggerContainer}
            >
              {popularTours.map(tour => (
                <motion.div key={tour._id} variants={fadeInUp}>
                  <TourCard 
                    tour={tour} 
                    showPackageButton={!!user}
                    userId={user?._id}
                  />
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
            <motion.div 
              className="grid md:grid-cols-3 gap-8"
              variants={staggerContainer}
            >
              {campaignTours.map(tour => (
                <motion.div key={tour._id} variants={fadeInUp}>
                  <TourCard 
                    tour={tour}
                    showPackageButton={!!user}
                    userId={user?._id}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Reviews Section */}
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
            {t('reviews.title')}
          </motion.h2>
          {featuredReviews.length > 0 ? (
            <motion.div 
              className="grid md:grid-cols-3 gap-8"
              variants={staggerContainer}
            >
              {featuredReviews.map((review) => (
                <motion.div 
                  key={review._id} 
                  className="p-8 border border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center text-yellow-500 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.242 3.824a1 1 0 00.95.691h4.025c.969 0 1.371 1.24.588 1.81l-3.253 2.365a1 1 0 00-.362 1.118l1.242 3.824c.3.921-.755 1.688-1.54 1.118l-3.253-2.365a1 1 0 00-1.176 0l-3.253 2.365c-.784.57-1.838-.197-1.54-1.118l1.242-3.824a1 1 0 00-.362-1.118L3.257 9.252c-.783-.57-.38-1.81.588-1.81h4.025a1 1 0 00.95-.691l1.242-3.824z" />
                      </svg>
                    ))}
                  </div>
                  <p className="italic text-gray-600 mb-4">"{review.comment}"</p>
                  <p className="font-semibold text-gray-800">- {review.name}</p>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p className="text-center text-gray-500">{t('reviews.noReviews')}</p>
          )}
        </div>
      </motion.section>
    </div>
  );
}

export default Home;