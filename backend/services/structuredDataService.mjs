/**
 * Structured Data Service
 *
 * @module services/structuredDataService
 * @description Service for generating JSON-LD structured data schemas
 *
 * Features:
 * - WebPage schema for CMS pages
 * - BreadcrumbList schema for navigation hierarchy
 * - Organization schema for homepage
 * - WebSite schema for homepage
 * - Validation and safe fallbacks
 */

import logger from '../config/logger.mjs';

/**
 * Get site URL from environment or use default
 */
const getSiteUrl = () => {
  return process.env.SITE_URL || 'https://gnbtransfer.com';
};

/**
 * Sanitize text for JSON-LD output
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim();
};

/**
 * Generate WebPage schema for a CMS page
 * @param {Object} page - Page object
 * @param {Object} options - Additional options
 * @returns {Object} WebPage JSON-LD schema
 */
export const generateWebPageSchema = (page, options = {}) => {
  try {
    if (!page || !page.slug || !page.title) {
      logger.warn('Invalid page data for WebPage schema generation');
      return null;
    }

    const siteUrl = getSiteUrl();
    const pageUrl = `${siteUrl}/${page.slug}`;
    const title = sanitizeText(page.seo?.title || page.title);
    const description = sanitizeText(page.seo?.description || '');
    
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': pageUrl,
      url: pageUrl,
      name: title,
      headline: title,
      datePublished: page.createdAt && !isNaN(new Date(page.createdAt).getTime()) 
        ? new Date(page.createdAt).toISOString() 
        : undefined,
      dateModified: page.updatedAt && !isNaN(new Date(page.updatedAt).getTime()) 
        ? new Date(page.updatedAt).toISOString() 
        : undefined,
      inLanguage: options.language || 'en',
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
      },
    };

    // Add description if available
    if (description) {
      schema.description = description;
    }

    // Add breadcrumb if provided
    if (options.breadcrumb) {
      schema.breadcrumb = {
        '@id': `${pageUrl}#breadcrumb`,
      };
    }

    // Remove undefined values
    Object.keys(schema).forEach((key) => schema[key] === undefined && delete schema[key]);

    return schema;
  } catch (error) {
    logger.error('Error generating WebPage schema:', {
      error: error.message,
      pageSlug: page?.slug,
    });
    return null;
  }
};

/**
 * Generate BreadcrumbList schema from menu hierarchy
 * @param {Object} page - Current page
 * @param {Array} menuItems - Menu items from navigation
 * @returns {Object} BreadcrumbList JSON-LD schema
 */
export const generateBreadcrumbSchema = (page, menuItems = []) => {
  try {
    if (!page || !page.slug) {
      return null;
    }

    const siteUrl = getSiteUrl();
    const pageUrl = `${siteUrl}/${page.slug}`;

    // Build breadcrumb list starting with Home
    const breadcrumbs = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
    ];

    // Try to find current page in menu to build hierarchy
    // For now, we'll just add the current page as second item
    // Can be enhanced later to traverse full menu hierarchy
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 2,
      name: sanitizeText(page.title),
      item: pageUrl,
    });

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: breadcrumbs,
    };

    return schema;
  } catch (error) {
    logger.error('Error generating BreadcrumbList schema:', {
      error: error.message,
      pageSlug: page?.slug,
    });
    return null;
  }
};

/**
 * Generate Organization schema for homepage
 * @param {Object} globalSettings - Global settings object
 * @returns {Object} Organization JSON-LD schema
 */
export const generateOrganizationSchema = (globalSettings = {}) => {
  try {
    const siteUrl = getSiteUrl();
    const siteName = globalSettings.siteName || 'GNB Transfer';
    const contactEmail = globalSettings.contactEmail || 'contact@gnbtransfer.com';
    const contactPhone = globalSettings.contactPhone || '+1234567890';
    const address = globalSettings.address || '123 Main Street, City, Country';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: globalSettings.logo
        ? {
            '@type': 'ImageObject',
            url: globalSettings.logo,
          }
        : undefined,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: contactPhone,
        contactType: 'customer service',
        email: contactEmail,
        availableLanguage: ['English', 'Turkish', 'Arabic', 'German', 'Spanish', 'Russian'],
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: address,
      },
      sameAs: [
        // Social media profiles can be added here
        // Example: 'https://www.facebook.com/gnbtransfer',
      ],
    };

    // Remove undefined values
    Object.keys(schema).forEach((key) => schema[key] === undefined && delete schema[key]);

    return schema;
  } catch (error) {
    logger.error('Error generating Organization schema:', {
      error: error.message,
    });
    return null;
  }
};

/**
 * Generate WebSite schema for homepage
 * @param {Object} homeLayout - Homepage layout object
 * @param {Object} globalSettings - Global settings object
 * @returns {Object} WebSite JSON-LD schema
 */
export const generateWebSiteSchema = (homeLayout = {}, globalSettings = {}) => {
  try {
    const siteUrl = getSiteUrl();
    const siteName = globalSettings.siteName || 'GNB Transfer';
    const seoTitle = homeLayout.seo?.title || siteName;
    const seoDescription =
      homeLayout.seo?.description || 'Premium Tourism & Transfer Services';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description: sanitizeText(seoDescription),
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      inLanguage: ['en', 'tr', 'ar', 'de', 'es', 'ru', 'zh', 'hi', 'it'],
    };

    return schema;
  } catch (error) {
    logger.error('Error generating WebSite schema:', {
      error: error.message,
    });
    return null;
  }
};

/**
 * Validate structured data is enabled for a page
 * @param {Object} page - Page object
 * @returns {boolean} Whether structured data should be generated
 */
export const isStructuredDataEnabled = (page) => {
  // If structuredData field doesn't exist, default to enabled (backward compatible)
  if (!page.structuredData) {
    return true;
  }

  return page.structuredData.enabled === true;
};

/**
 * Generate all schemas for a page
 * @param {Object} page - Page object
 * @param {Object} options - Additional options (menuItems, language, etc.)
 * @returns {Array} Array of JSON-LD schemas
 */
export const generatePageSchemas = (page, options = {}) => {
  try {
    // Check if page is published and structured data is enabled
    if (!page || !page.published || !isStructuredDataEnabled(page)) {
      return [];
    }

    const schemas = [];

    // Generate WebPage schema
    const webPageSchema = generateWebPageSchema(page, options);
    if (webPageSchema) {
      schemas.push(webPageSchema);
    }

    // Generate BreadcrumbList schema if menu items provided
    if (options.includeMenuItems !== false) {
      const breadcrumbSchema = generateBreadcrumbSchema(page, options.menuItems);
      if (breadcrumbSchema) {
        schemas.push(breadcrumbSchema);
      }
    }

    return schemas;
  } catch (error) {
    logger.error('Error generating page schemas:', {
      error: error.message,
      pageSlug: page?.slug,
    });
    return [];
  }
};

/**
 * Generate all schemas for homepage
 * @param {Object} homeLayout - Homepage layout object
 * @param {Object} globalSettings - Global settings object
 * @returns {Array} Array of JSON-LD schemas
 */
export const generateHomepageSchemas = (homeLayout, globalSettings = {}) => {
  try {
    const schemas = [];

    // Generate Organization schema
    const orgSchema = generateOrganizationSchema(globalSettings);
    if (orgSchema) {
      schemas.push(orgSchema);
    }

    // Generate WebSite schema
    const webSiteSchema = generateWebSiteSchema(homeLayout, globalSettings);
    if (webSiteSchema) {
      schemas.push(webSiteSchema);
    }

    return schemas;
  } catch (error) {
    logger.error('Error generating homepage schemas:', {
      error: error.message,
    });
    return [];
  }
};

export default {
  generateWebPageSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generatePageSchemas,
  generateHomepageSchemas,
  isStructuredDataEnabled,
};
