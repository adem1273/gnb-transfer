import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import TourCard from '../components/TourCard';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function Tours() {
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await API.get('/tours');
        setTours(res.data);
        setFilteredTours(res.data);
        setLoading(false);
      } catch (err) {
        // Keep console.error for production debugging
        if (process.env.NODE_ENV !== 'production') {
          console.error(err);
        }
        setError('Failed to load tours.');
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  useEffect(() => {
    filterAndSortTours();
  }, [selectedCategory, priceRange, sortBy, tours]);

  const filterAndSortTours = () => {
    let result = [...tours];

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(tour => {
        if (selectedCategory === 'campaigns') return tour.isCampaign;
        if (selectedCategory === 'featured') return tour.isFeatured;
        return tour.category === selectedCategory;
      });
    }

    // Filter by price
    if (priceRange !== 'all') {
      result = result.filter(tour => {
        const price = tour.price;
        if (priceRange === 'budget') return price < 50;
        if (priceRange === 'mid') return price >= 50 && price <= 150;
        if (priceRange === 'luxury') return price > 150;
        return true;
      });
    }

    // Sort tours
    result.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      // Default: popular (campaigns first, then by discount)
      if (a.isCampaign !== b.isCampaign) return b.isCampaign ? 1 : -1;
      return (b.discount || 0) - (a.discount || 0);
    });

    setFilteredTours(result);
  };

  if (loading) {
    return <Loading message="Loading tours..." fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const categories = [
    { id: 'all', label: t('tours.categories.all') || 'All Tours' },
    { id: 'campaigns', label: t('tours.categories.campaigns') || 'Special Offers' },
    { id: 'featured', label: t('tours.categories.featured') || 'Featured' },
    { id: 'airport', label: t('tours.categories.airport') || 'Airport Transfer' },
    { id: 'city', label: t('tours.categories.city') || 'City Tours' },
    { id: 'nature', label: t('tours.categories.nature') || 'Nature & Adventure' },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Tours - GNB Transfer</title>
        <meta name="description" content="Explore our wide range of tours and transfer services in Turkey" />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t('tours.title') || 'Explore Our Tours'}
          </motion.h1>
          <motion.p 
            className="text-xl text-blue-100"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('tours.subtitle') || 'Discover amazing destinations and experiences'}
          </motion.p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Section */}
        <motion.div 
          className="bg-white rounded-xl shadow-md p-6 mb-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="grid md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tours.filter.category') || 'Category'}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tours.filter.price') || 'Price Range'}
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('tours.filter.allPrices') || 'All Prices'}</option>
                <option value="budget">{t('tours.filter.budget') || 'Budget ($0-$50)'}</option>
                <option value="mid">{t('tours.filter.mid') || 'Mid-range ($50-$150)'}</option>
                <option value="luxury">{t('tours.filter.luxury') || 'Luxury ($150+)'}</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tours.filter.sortBy') || 'Sort By'}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="popular">{t('tours.filter.popular') || 'Most Popular'}</option>
                <option value="price-low">{t('tours.filter.priceLow') || 'Price: Low to High'}</option>
                <option value="price-high">{t('tours.filter.priceHigh') || 'Price: High to Low'}</option>
                <option value="name">{t('tours.filter.name') || 'Name (A-Z)'}</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              {t('tours.showing')} <span className="font-semibold">{filteredTours.length}</span> {t('tours.results')}
            </p>
          </div>
        </motion.div>

        {/* Tours Grid */}
        {filteredTours.length > 0 ? (
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="initial"
            animate="animate"
            variants={{
              animate: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {filteredTours.map((tour) => (
              <motion.div
                key={tour._id}
                variants={fadeInUp}
              >
                <TourCard 
                  tour={tour} 
                  showPackageButton={!!user}
                  userId={user?._id}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-16"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {t('tours.noResults') || 'No tours found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('tours.tryDifferentFilters') || 'Try adjusting your filters'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setPriceRange('all');
                setSortBy('popular');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('tours.resetFilters') || 'Reset Filters'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Tours;