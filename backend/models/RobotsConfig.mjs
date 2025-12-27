import mongoose from 'mongoose';

/**
 * RobotsConfig Model
 *
 * @module models/RobotsConfig
 * @description Mongoose model for managing robots.txt configuration
 *
 * Features:
 * - Admin-configurable robots.txt rules
 * - Custom user agent rules
 * - Sitemap URL configuration
 * - Crawl delay settings
 * - Singleton pattern (only one config document)
 */

const userAgentRuleSchema = new mongoose.Schema(
  {
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
      trim: true,
      default: '*',
    },
    allow: {
      type: [String],
      default: [],
    },
    disallow: {
      type: [String],
      default: [],
    },
    crawlDelay: {
      type: Number,
      min: [0, 'Crawl delay must be non-negative'],
      max: [60, 'Crawl delay cannot exceed 60 seconds'],
    },
  },
  { _id: false }
);

const robotsConfigSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
      description: 'Enable custom robots.txt configuration',
    },
    sitemapUrl: {
      type: String,
      trim: true,
      default: '/sitemap.xml',
    },
    rules: {
      type: [userAgentRuleSchema],
      default: [
        {
          userAgent: '*',
          allow: ['/', '/tours', '/tours/*', '/booking', '/blog', '/blog/*', '/contact', '/services', '/about'],
          disallow: ['/admin/', '/driver/', '/api/'],
          crawlDelay: 1,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one configuration document exists
robotsConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

// Method to generate robots.txt content
robotsConfigSchema.methods.generateRobotsTxt = function (siteUrl) {
  if (!this.enabled) {
    // Return default safe configuration if custom config is disabled
    return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${siteUrl}/sitemap.xml

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
  }

  let robotsTxt = '';

  // Generate rules for each user agent
  for (const rule of this.rules) {
    robotsTxt += `User-agent: ${rule.userAgent}\n`;

    // Add Allow rules
    if (rule.allow && rule.allow.length > 0) {
      for (const path of rule.allow) {
        robotsTxt += `Allow: ${path}\n`;
      }
    }

    // Add Disallow rules
    if (rule.disallow && rule.disallow.length > 0) {
      for (const path of rule.disallow) {
        robotsTxt += `Disallow: ${path}\n`;
      }
    }

    // Add crawl delay if specified
    if (rule.crawlDelay !== undefined && rule.crawlDelay !== null) {
      robotsTxt += `Crawl-delay: ${rule.crawlDelay}\n`;
    }

    robotsTxt += '\n';
  }

  // Add sitemap URL
  const sitemapPath = this.sitemapUrl || '/sitemap.xml';
  let fullSitemapUrl;
  
  if (sitemapPath.startsWith('http')) {
    // Absolute URL
    fullSitemapUrl = sitemapPath;
  } else {
    // Relative path - ensure it starts with /
    const normalizedPath = sitemapPath.startsWith('/') ? sitemapPath : `/${sitemapPath}`;
    fullSitemapUrl = `${siteUrl}${normalizedPath}`;
  }
  
  robotsTxt += `# Sitemap\nSitemap: ${fullSitemapUrl}\n`;

  return robotsTxt.trim();
};

const RobotsConfig = mongoose.models.RobotsConfig || mongoose.model('RobotsConfig', robotsConfigSchema);
export default RobotsConfig;
