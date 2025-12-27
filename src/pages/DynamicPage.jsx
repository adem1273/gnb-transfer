import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

/**
 * DynamicPage Component
 * 
 * Renders CMS pages dynamically based on slug
 * Supports multiple section types: text, markdown, image
 */
const DynamicPage = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);

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
        
        // Set SEO meta tags if available
        if (data.data.seo) {
          if (data.data.seo.title) {
            document.title = `${data.data.seo.title} | GNB Transfer`;
          }
          if (data.data.seo.description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
              metaDescription.setAttribute('content', data.data.seo.description);
            }
          }
        } else if (data.data.title) {
          document.title = `${data.data.title} | GNB Transfer`;
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('networkError');
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

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
        return (
          <div key={index} className="mb-6">
            <img
              src={section.content}
              alt={`Content image ${index + 1}`}
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

  return (
    <div className="container mx-auto px-4 py-8">
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
