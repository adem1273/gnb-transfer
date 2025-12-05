import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';

const CATEGORIES = {
  'transfer-prices': { tr: 'Transfer Fiyatları', en: 'Transfer Prices', ar: 'أسعار النقل', ru: 'Цены трансфера', de: 'Transferpreise', fr: 'Prix des transferts', es: 'Precios de traslados', zh: '接送价格', fa: 'قیمت ترانسفر' },
  'destinations': { tr: 'Destinasyonlar', en: 'Destinations', ar: 'الوجهات', ru: 'Направления', de: 'Reiseziele', fr: 'Destinations', es: 'Destinos', zh: '目的地', fa: 'مقاصد' },
  'services': { tr: 'Hizmetler', en: 'Services', ar: 'الخدمات', ru: 'Услуги', de: 'Dienstleistungen', fr: 'Services', es: 'Servicios', zh: '服务', fa: 'خدمات' },
  'tips': { tr: 'Seyahat İpuçları', en: 'Travel Tips', ar: 'نصائح السفر', ru: 'Советы', de: 'Reisetipps', fr: 'Conseils', es: 'Consejos', zh: '旅行提示', fa: 'نکات سفر' },
  'news': { tr: 'Haberler', en: 'News', ar: 'الأخبار', ru: 'Новости', de: 'Nachrichten', fr: 'Actualités', es: 'Noticias', zh: '新闻', fa: 'اخبار' },
  'promotions': { tr: 'Kampanyalar', en: 'Promotions', ar: 'العروض', ru: 'Акции', de: 'Aktionen', fr: 'Promotions', es: 'Promociones', zh: '促销', fa: 'تخفیفات' },
  'seasonal': { tr: 'Sezonluk', en: 'Seasonal', ar: 'موسمي', ru: 'Сезонные', de: 'Saisonal', fr: 'Saisonnier', es: 'Estacional', zh: '季节性', fa: 'فصلی' },
};

function Blog() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'tr';
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  
  const selectedCategory = searchParams.get('category') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [currentLang, selectedCategory, currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        lang: currentLang,
        page: currentPage.toString(),
        limit: '12',
      });
      if (selectedCategory) params.append('category', selectedCategory);
      
      const res = await API.get(`/blogs?${params.toString()}`);
      const data = res.data?.data;
      setPosts(data?.posts || []);
      setPagination(data?.pagination || { page: 1, pages: 1, total: 0 });
      setError('');
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      setError(t('blog.loadError') || 'Failed to load blog posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get('/blogs/categories');
      setCategories(res.data?.data?.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryName = (categoryId) => {
    return CATEGORIES[categoryId]?.[currentLang] || CATEGORIES[categoryId]?.en || categoryId;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // SEO metadata
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gnbtransfer.com';
  const pageTitle = selectedCategory 
    ? `${getCategoryName(selectedCategory)} | GNB Transfer Blog`
    : t('blog.pageTitle') || 'Blog | GNB Transfer - VIP Transfer Hizmetleri';
  const pageDescription = t('blog.pageDescription') || 'İstanbul VIP transfer, havalimanı ulaşımı, turistik tur rehberleri ve özel şoförlü araç kiralama hakkında en güncel bilgiler.';

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'GNB Transfer Blog',
    description: pageDescription,
    url: `${siteUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'GNB Transfer',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/gnb-logo.png`,
      },
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      image: post.featuredImage,
      author: {
        '@type': 'Organization',
        name: 'GNB Transfer',
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="İstanbul transfer, VIP transfer, havalimanı transfer, turist rehberi, Sabiha Gökçen, İstanbul Havalimanı" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}/blog`} />
        <meta property="og:image" content={`${siteUrl}/images/blog-og.jpg`} />
        <meta property="og:site_name" content="GNB Transfer" />
        <meta property="og:locale" content={currentLang} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={`${siteUrl}/images/blog-og.jpg`} />
        
        {/* Canonical */}
        <link rel="canonical" href={`${siteUrl}/${currentLang !== 'tr' ? currentLang + '/' : ''}blog`} />
        
        {/* Alternate languages */}
        <link rel="alternate" hrefLang="tr" href={`${siteUrl}/blog`} />
        <link rel="alternate" hrefLang="en" href={`${siteUrl}/en/blog`} />
        <link rel="alternate" hrefLang="ar" href={`${siteUrl}/ar/blog`} />
        <link rel="alternate" hrefLang="ru" href={`${siteUrl}/ru/blog`} />
        <link rel="alternate" hrefLang="de" href={`${siteUrl}/de/blog`} />
        <link rel="alternate" hrefLang="fr" href={`${siteUrl}/fr/blog`} />
        <link rel="alternate" hrefLang="es" href={`${siteUrl}/es/blog`} />
        <link rel="alternate" hrefLang="zh" href={`${siteUrl}/zh/blog`} />
        <link rel="alternate" hrefLang="fa" href={`${siteUrl}/fa/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${siteUrl}/blog`} />
        
        {/* RSS Feed */}
        <link rel="alternate" type="application/rss+xml" title="GNB Transfer Blog RSS" href={`${siteUrl}/api/blogs/feed/rss?lang=${currentLang}`} />
        
        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('blog.title') || 'GNB Transfer Blog'}
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            {t('blog.subtitle') || 'VIP transfer hizmetleri, İstanbul rehberleri ve seyahat ipuçları'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-2 rounded-full transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            {t('blog.allPosts') || 'Tüm Yazılar'}
          </button>
          {Object.keys(CATEGORIES).map((catId) => (
            <button
              key={catId}
              onClick={() => handleCategoryChange(catId)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === catId
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {getCategoryName(catId)}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('blog.noPosts') || 'Henüz blog yazısı yok'}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('blog.noPostsDescription') || 'Yakında VIP transfer ve turizm hakkında faydalı içerikler paylaşacağız.'}
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('blog.bookNow') || 'Şimdi Rezervasyon Yap'}
            </Link>
          </div>
        ) : (
          /* Blog Posts Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <article
                  key={post._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  <Link to={`/blog/${post.slug}`}>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.featuredImage || '/images/blog-placeholder.jpg'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                          {getCategoryName(post.category)}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <span>{formatDate(post.publishedAt)}</span>
                      {post.readingTime && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{post.readingTime} {t('blog.minRead') || 'dk okuma'}</span>
                        </>
                      )}
                    </div>
                    <Link to={`/blog/${post.slug}`}>
                      <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="text-gray-600 line-clamp-3 mb-4">
                      {post.excerpt || post.metaDescription}
                    </p>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700"
                    >
                      {t('blog.readMore') || 'Devamını Oku'}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.previous') || 'Önceki'}
                </button>
                
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.next') || 'Sonraki'}
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('blog.ctaTitle') || 'VIP Transfer Hizmetimizi Deneyin'}
          </h2>
          <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
            {t('blog.ctaDescription') || '75$\'dan başlayan fiyatlarla profesyonel şoförlü araç kiralama. İstanbul Havalimanı ve Sabiha Gökçen transferlerinde %15 indirim!'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t('blog.bookTransfer') || 'Hemen Rezervasyon Yap'}
            </Link>
            <a
              href="https://wa.me/905551234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Blog;
