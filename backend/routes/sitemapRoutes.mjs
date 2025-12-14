/**
 * Sitemap Routes
 *
 * @module routes/sitemapRoutes
 * @description Dynamic sitemap generation with multi-language support
 */

import express from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import Tour from '../models/Tour.mjs';
import BlogPost from '../models/BlogPost.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

const SITE_URL = process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://gnbtransfer.com';
const SUPPORTED_LANGUAGES = ['tr', 'en', 'ar', 'ru', 'de', 'fr', 'es', 'zh', 'fa', 'hi', 'it'];

/**
 * @route   GET /api/sitemap
 * @desc    Generate dynamic sitemap.xml with all pages, tours, and blog posts in all languages
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    logger.info('Generating dynamic sitemap');

    // Static pages for all languages
    const staticPages = [
      { path: '', priority: 1.0, changefreq: 'daily' },
      { path: '/tours', priority: 0.9, changefreq: 'daily' },
      { path: '/booking', priority: 0.9, changefreq: 'weekly' },
      { path: '/blog', priority: 0.9, changefreq: 'daily' },
      { path: '/contact', priority: 0.7, changefreq: 'monthly' },
      { path: '/about', priority: 0.6, changefreq: 'monthly' },
      { path: '/services', priority: 0.8, changefreq: 'monthly' },
    ];

    const pages = [];

    // Add static pages for each language
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const page of staticPages) {
        const langPrefix = lang === 'tr' ? '' : `/${lang}`;
        const url = `${langPrefix}${page.path}`;
        
        pages.push({
          url: url || '/',
          changefreq: page.changefreq,
          priority: page.priority,
          links: SUPPORTED_LANGUAGES.map((l) => ({
            lang: l,
            url: `${SITE_URL}${l === 'tr' ? '' : `/${l}`}${page.path}`,
          })),
        });
      }
    }

    // Get all active tours
    const tours = await Tour.find({ active: true })
      .select('_id slug title updatedAt')
      .lean()
      .exec();

    // Add tour pages
    for (const tour of tours) {
      const tourSlug = tour.slug || tour._id;
      pages.push({
        url: `/tours/${tourSlug}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: tour.updatedAt ? tour.updatedAt.toISOString() : new Date().toISOString(),
      });
    }

    // Get all published blog posts
    const blogPosts = await BlogPost.find({ status: 'published' })
      .select('translations updatedAt')
      .lean()
      .exec();

    // Add blog post pages for each language
    for (const post of blogPosts) {
      for (const lang of SUPPORTED_LANGUAGES) {
        const translation = post.translations?.[lang];
        if (translation?.slug && translation?.title) {
          const langPrefix = lang === 'tr' ? '' : `/${lang}`;
          const url = `${langPrefix}/blog/${translation.slug}`;
          
          pages.push({
            url,
            changefreq: 'weekly',
            priority: 0.7,
            lastmod: post.updatedAt ? post.updatedAt.toISOString() : new Date().toISOString(),
          });
        }
      }
    }

    // Create sitemap stream
    const stream = new SitemapStream({ 
      hostname: SITE_URL,
      xmlns: {
        news: false,
        xhtml: true,
        image: false,
        video: false,
      },
    });

    // Generate sitemap XML
    const xml = await streamToPromise(Readable.from(pages).pipe(stream));

    logger.info(`Sitemap generated successfully with ${pages.length} URLs`);

    // Set headers
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return res.send(xml);
  } catch (error) {
    logger.error('Error generating sitemap:', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      error: 'Failed to generate sitemap',
    });
  }
});

/**
 * @route   GET /api/sitemap/robots.txt
 * @desc    Generate dynamic robots.txt
 * @access  Public
 */
router.get('/robots.txt', (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Disallow admin and private routes
Disallow: /admin/
Disallow: /driver/
Disallow: /api/

# Allow important pages
Allow: /
Allow: /tours
Allow: /tours/*
Allow: /booking
Allow: /blog
Allow: /blog/*
Allow: /contact
Allow: /services
Allow: /about

# Crawl delay (be nice to servers)
Crawl-delay: 1`;

  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  return res.send(robotsTxt);
});

export default router;
