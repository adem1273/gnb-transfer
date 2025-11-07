import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const [popularTours, setPopularTours] = useState([]); // Yeni state: Popüler turlar
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
        
        const popularToursRes = await API.get('/tours/most-popular'); // Yeni API çağrısı
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

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Helmet>
        <title>GNB Transfer | {t('header.home')}</title>
        <meta name="description" content={t('home.slogan')} />
      </Helmet>

      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">{t('home.welcome')}</h1>
        <p className="text-lg mb-6">{t('home.slogan')}</p>
        <Link to="/booking" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
          {t('home.bookNow')}
        </Link>
      </section>

      <section className="py-12 bg-gray-100 rounded-lg shadow-md text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          {t('home.whyChooseUsTitle')}
        </h2>
        <div className="flex flex-wrap justify-center gap-8">
          <TrustBadge 
            title={t('home.trustBadge1Title')}
            description={t('home.trustBadge1Desc')}
          />
          <TrustBadge 
            title={t('home.trustBadge2Title')}
            description={t('home.trustBadge2Desc')}
          />
          <TrustBadge 
            title={t('home.trustBadge3Title')}
            description={t('home.trustBadge3Desc')}
          />
        </div>
      </section>
      
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {t('home.servicesTitle')}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 border rounded shadow">
            <h3 className="text-2xl font-bold mb-2">Istanbul Airport Transfer</h3>
            <p>Fast and safe airport transfer service in Istanbul.</p>
          </div>
          <div className="p-6 border rounded shadow">
            <h3 className="text-2xl font-bold mb-2">Bursa & Uludağ Tours</h3>
            <p>Discover the beauty of Bursa and ski in Uludağ with our guided tours.</p>
          </div>
          <div className="p-6 border rounded shadow">
            <h3 className="text-2xl font-bold mb-2">Pamukkale & Trabzon Tours</h3>
            <p>Explore the natural wonders and historic sites in Turkey.</p>
          </div>
        </div>
      </section>

      {/* Popüler Turlar Bölümü (Yeni) */}
      {popularTours.length > 0 && (
          <section className="py-12 bg-white rounded-lg shadow-md my-8">
              <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
                  {t('home.mostPopularToursTitle')}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                  {popularTours.map(tour => (
                      <TourCard 
                        key={tour._id} 
                        tour={tour} 
                        showPackageButton={!!user}
                        userId={user?._id}
                      />
                  ))}
              </div>
          </section>
      )}

      {/* Kampanyalı Turlar Bölümü (Mevcut) */}
      {campaignTours.length > 0 && (
          <section className="py-12 bg-gray-100 rounded-lg shadow-md my-8">
              <h2 className="text-3xl font-bold text-center text-red-600 mb-8">
                  {t('home.campaignsTitle')}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                  {campaignTours.map(tour => (
                      <TourCard 
                        key={tour._id} 
                        tour={tour}
                        showPackageButton={!!user}
                        userId={user?._id}
                      />
                  ))}
              </div>
          </section>
      )}

      <section className="py-12 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {t('reviews.title')}
        </h2>
        {featuredReviews.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {featuredReviews.map((review) => (
              <div key={review._id} className="p-6 border rounded-lg shadow-sm">
                <div className="flex items-center text-yellow-500 my-2">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.242 3.824a1 1 0 00.95.691h4.025c.969 0 1.371 1.24.588 1.81l-3.253 2.365a1 1 0 00-.362 1.118l1.242 3.824c.3.921-.755 1.688-1.54 1.118l-3.253-2.365a1 1 0 00-1.176 0l-3.253 2.365c-.784.57-1.838-.197-1.54-1.118l1.242-3.824a1 1 0 00-.362-1.118L3.257 9.252c-.783-.57-.38-1.81.588-1.81h4.025a1 1 0 00.95-.691l1.242-3.824z" />
                    </svg>
                  ))}
                </div>
                <p className="italic text-gray-600">"{review.comment}"</p>
                <p className="font-semibold mt-4">- {review.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">{t('reviews.noReviews')}</p>
        )}
      </section>
    </div>
  );
}

export default Home;