import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';

/**
 * SEO Component
 * Provides comprehensive SEO meta tags with i18n support
 * Supports OpenGraph, Twitter Cards, and JSON-LD structured data
 */
const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  article,
  jsonLd,
  noindex = false,
  canonical,
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'tr';
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://gnbtransfer.com';
  
  // Default values
  const defaultTitle = 'GNB Transfer - Premium Tourism & Transfer Services';
  const defaultDescription = 'Professional airport transfers and tourism services in Turkey. Book your comfortable, safe transfer with experienced drivers.';
  const defaultImage = `${siteUrl}/images/og-image.jpg`;
  
  const seoTitle = title || defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoImage = image || defaultImage;
  const seoUrl = url || `${siteUrl}${window.location.pathname}`;
  const canonicalUrl = canonical || seoUrl;

  // Language-specific meta tags
  const langAlternates = [
    'tr', 'en', 'ar', 'ru', 'de', 'fr', 'es', 'zh', 'fa', 'hi', 'it'
  ];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={currentLang} />
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}
      
      {/* Language Alternates */}
      {langAlternates.map((lang) => {
        const langPrefix = lang === 'tr' ? '' : `/${lang}`;
        return (
          <link
            key={lang}
            rel="alternate"
            hrefLang={lang}
            href={`${siteUrl}${langPrefix}${window.location.pathname}`}
          />
        );
      })}
      <link rel="alternate" hrefLang="x-default" href={`${siteUrl}${window.location.pathname}`} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={currentLang} />
      <meta property="og:site_name" content="GNB Transfer" />
      
      {/* Article specific */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:modified_time" content={article.modifiedTime} />
          <meta property="article:author" content={article.author} />
          {article.tags && article.tags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:site" content="@gnbtransfer" />
      <meta name="twitter:creator" content="@gnbtransfer" />
      
      {/* Additional SEO Tags */}
      <meta name="author" content="GNB Transfer" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
