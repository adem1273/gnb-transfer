/**
 * Sitemap Generation Service
 *
 * @module services/sitemapService
 * @description Auto-generates sitemap.xml for SEO
 */

import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import Tour from '../models/Tour.mjs';
import logger from '../config/logger.mjs';

const SITE_URL = process.env.SITE_URL || 'https://gnbtransfer.com';
const SITEMAP_PATH = path.join(process.cwd(), '../public/sitemap.xml');

/**
 * Generate sitemap.xml
 *
 * @returns {Promise<string>} - Path to generated sitemap
 */
export const generateSitemap = async () => {
  try {
    logger.info('Generating sitemap...');

    // Define static pages
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/tours', changefreq: 'daily', priority: 0.9 },
      { url: '/booking', changefreq: 'weekly', priority: 0.8 },
      { url: '/contact', changefreq: 'monthly', priority: 0.7 },
      { url: '/blog', changefreq: 'weekly', priority: 0.7 },
      { url: '/about', changefreq: 'monthly', priority: 0.6 },
      { url: '/login', changefreq: 'monthly', priority: 0.5 },
      { url: '/register', changefreq: 'monthly', priority: 0.5 },
    ];

    // Get all active tours
    const tours = await Tour.find({}).select('_id title updatedAt').lean();

    // Create dynamic tour pages
    const tourPages = tours.map((tour) => ({
      url: `/tours/${tour._id}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: tour.updatedAt ? tour.updatedAt.toISOString() : new Date().toISOString(),
    }));

    // Combine all pages
    const allPages = [...staticPages, ...tourPages];

    // Create sitemap stream
    const stream = new SitemapStream({ hostname: SITE_URL });

    // Generate sitemap XML
    const xml = await streamToPromise(Readable.from(allPages).pipe(stream)).then((data) =>
      data.toString()
    );

    // Ensure directory exists
    const dir = path.dirname(SITEMAP_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(SITEMAP_PATH, xml);

    logger.info(`Sitemap generated successfully: ${SITEMAP_PATH}`);
    logger.info(`Sitemap contains ${allPages.length} URLs`);

    return {
      success: true,
      path: SITEMAP_PATH,
      urlCount: allPages.length,
    };
  } catch (error) {
    logger.error('Failed to generate sitemap:', { error: error.message });
    throw error;
  }
};

/**
 * Initialize sitemap generation scheduler
 * Runs every Monday at 3:00 AM
 */
export const initSitemapScheduler = () => {
  // Generate immediately on startup
  generateSitemap().catch((error) => {
    logger.error('Initial sitemap generation failed:', { error: error.message });
  });

  // Schedule weekly generation
  cron.schedule('0 3 * * 1', () => {
    logger.info('Running scheduled sitemap generation');
    generateSitemap().catch((error) => {
      logger.error('Scheduled sitemap generation failed:', { error: error.message });
    });
  });

  logger.info('Sitemap scheduler initialized (runs every Monday at 3:00 AM)');
};

export default {
  generateSitemap,
  initSitemapScheduler,
};
