import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import ReactMarkdown from 'react-markdown';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

/**
 * DynamicPage Component
 * 
 * Renders CMS pages dynamically based on slug
 * Supports multiple section types: text, markdown, image
 * Optimized to prevent duplicate fetches
 */
const DynamicPage = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedSlugsRef = useRef(new Set());

  useEffect(() => {
    const fetchPage = async () => {
      // Prevent duplicate fetches for the same slug
      if (fetchedSlugsRef.current.has(slug)) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        fetchedSlugsRef.current.add(slug);

        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${apiUrl}/pages/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('notFound');
          } else {
            setError('serverError');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        if (!data.success) {
          setError('serverError');
          setLoading(false);
          return;
        }

        setPage(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('networkError');
        setLoading(false);
        fetchedSlugsRef.current.delete(slug); // Allow retry on error
      }
    };

    if (slug) {
      fetchPage();
    }
    
    // Reset fetched slugs when slug changes
    return () => {
      if (!fetchedSlugsRef.current.has(slug)) {
        fetchedSlugsRef.current.clear();
      }
    };
  }, [slug]);

  // Validate image URL to ensure it's from trusted sources
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    try {
      // Allow data URLs for embedded images
      if (url.startsWith('data:image/')) return true;
      
      const urlObj = new URL(url);
      
      // Trusted domains with exact matching to prevent subdomain attacks
      const trustedDomains = [
        'res.cloudinary.com',
        'cloudinary.com',
      ];
      
      // For same-origin images, check exact hostname match
      if (urlObj.hostname === window.location.hostname) {
        return true;
      }
      
      // Check if hostname exactly matches or is a direct subdomain of trusted domains
      return trustedDomains.some(domain => {
        return urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain);
      });
    } catch {
      // Invalid URL
      return false;
    }
  };

  // Render section based on type
  const renderSection = (section, index) => {
    switch (section.type) {
      case 'text':
        return (
          <div key={index} className="prose prose-lg max-w-none mb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </p>
          </div>
        );

      case 'markdown':
        return (
          <div key={index} className="prose prose-lg max-w-none mb-6">
            <ReactMarkdown>{section.content}</ReactMarkdown>
          </div>
        );

      case 'image':
        // Validate image URL before rendering
        if (!isValidImageUrl(section.content)) {
          console.warn('Invalid or untrusted image URL:', section.content);
          return null;
        }
        
        return (
          <div key={index} className="mb-6">
            <img
              src={section.content}
              alt={section.alt || page?.title || 'Page content image'}
              className="w-full h-auto rounded-lg shadow-md"
              loading="lazy"
            />
          </div>
        );

      default:
        console.warn(`Unknown section type: ${section.type}`);
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  // Error states
  if (error === 'notFound') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('errors.pageNotFound', '404 - Page Not Found')}
          </h1>
          <p className="text-gray-600 mb-8">
            {t('errors.pageNotFoundMessage', 'The page you are looking for does not exist or has been unpublished.')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.goHome', 'Go to Home')}
          </button>
        </div>
      </div>
    );
  }

  if (error === 'networkError') {
    return (
      <div className="container mx-auto px-4 py-12">
        <ErrorMessage message={t('errors.networkError', 'Unable to connect to the server. Please check your internet connection.')} />
        <div className="text-center mt-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  if (error === 'serverError') {
    return (
      <div className="container mx-auto px-4 py-12">
        <ErrorMessage message={t('errors.serverError', 'An error occurred while loading the page.')} />
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.goHome', 'Go to Home')}
          </button>
        </div>
      </div>
    );
  }

  // Render page content
  if (!page) {
    return null;
  }

  // Prepare SEO data
  const pageTitle = page.seo?.title || page.title || 'Page';
  const pageDescription = page.seo?.description || '';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{pageTitle} | GNB Transfer</title>
        {pageDescription && <meta name="description" content={pageDescription} />}
        <meta property="og:title" content={pageTitle} />
        {pageDescription && <meta property="og:description" content={pageDescription} />}
        <meta property="og:type" content="article" />
        
        {/* JSON-LD Structured Data */}
        {page.structuredData && Array.isArray(page.structuredData) && page.structuredData.length > 0 && (
          page.structuredData.map((schema, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(schema)}
            </script>
          ))
        )}
      </Helmet>

      <article className="max-w-4xl mx-auto">
        {/* Page Title */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {page.title}
          </h1>
          {page.updatedAt && (
            <p className="text-sm text-gray-500">
              {t('common.lastUpdated', 'Last updated')}: {new Date(page.updatedAt).toLocaleDateString()}
            </p>
          )}
        </header>

        {/* Page Sections */}
        <div className="space-y-6">
          {page.sections && page.sections.length > 0 ? (
            page.sections.map((section, index) => renderSection(section, index))
          ) : (
            <p className="text-gray-500 italic">
              {t('cms.noContent', 'No content available.')}
            </p>
          )}
        </div>
      </article>
    </div>
  );
};

export default DynamicPage;
