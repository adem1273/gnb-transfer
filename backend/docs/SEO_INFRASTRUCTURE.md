# SEO Infrastructure Documentation

## Overview

The GNB Transfer CMS includes a comprehensive SEO infrastructure for search engine optimization and discovery. This system provides dynamic sitemap generation, configurable robots.txt rules, and canonical URL support for all CMS pages.

## Features

### 1. Dynamic Sitemap Generation

**Endpoint:** `GET /api/sitemap` or `/sitemap.xml`

The sitemap is automatically generated and includes:
- **Homepage** - Highest priority (1.0)
- **Static pages** - Tours, Booking, Blog, Contact, About, Services
- **CMS Pages** - All published pages from the Page model
- **Tours** - All active tour listings
- **Blog Posts** - All published blog posts in all supported languages

#### Sitemap Characteristics

- **Format:** XML sitemap compliant with sitemap.org protocol
- **Multi-language Support:** Supports 11 languages (tr, en, ar, ru, de, fr, es, zh, fa, hi, it)
- **Last Modified Dates:** Includes `lastmod` timestamps from the database `updatedAt` field
- **Change Frequency:** Configures appropriate `changefreq` for each page type
- **Priority Values:** Sets SEO priority based on page importance
- **Caching:** Cached for 1 hour (max-age=3600) to reduce server load

#### Priority Levels

| Page Type | Priority | Change Frequency |
|-----------|----------|------------------|
| Homepage | 1.0 | daily |
| Tours Listing | 0.9 | daily |
| Booking | 0.9 | weekly |
| Blog Listing | 0.9 | daily |
| CMS Pages | 0.8 | weekly |
| Tours Detail | 0.8 | weekly |
| Blog Posts | 0.7 | weekly |
| Contact | 0.7 | monthly |
| About | 0.6 | monthly |
| Services | 0.8 | monthly |

#### Example Sitemap Entry

```xml
<url>
  <loc>https://gnbtransfer.com/test-page</loc>
  <lastmod>2024-01-15T10:00:00.000Z</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
```

### 2. Robots.txt Configuration

**Public Endpoint:** `GET /api/sitemap/robots.txt`

**Admin Endpoints:**
- `GET /api/admin/robots-config` - Get current configuration
- `PUT /api/admin/robots-config` - Update configuration
- `GET /api/admin/robots-config/preview` - Preview generated robots.txt
- `POST /api/admin/robots-config/reset` - Reset to default configuration

#### Default Configuration

The default robots.txt configuration is SEO-friendly and secure:

```
User-agent: *
Allow: /
Allow: /tours
Allow: /tours/*
Allow: /booking
Allow: /blog
Allow: /blog/*
Allow: /contact
Allow: /services
Allow: /about

Disallow: /admin/
Disallow: /driver/
Disallow: /api/

Crawl-delay: 1

# Sitemap
Sitemap: https://gnbtransfer.com/sitemap.xml
```

#### Admin Configuration

Administrators can customize robots.txt through the admin panel or API:

**Configuration Schema:**
```javascript
{
  enabled: Boolean,           // Enable/disable custom configuration
  sitemapUrl: String,         // Custom sitemap URL (default: /sitemap.xml)
  rules: [
    {
      userAgent: String,      // User agent name (e.g., "Googlebot", "*")
      allow: [String],        // Array of allowed paths
      disallow: [String],     // Array of disallowed paths
      crawlDelay: Number      // Crawl delay in seconds (0-60)
    }
  ]
}
```

**Example Custom Configuration:**

```javascript
{
  "enabled": true,
  "sitemapUrl": "/sitemap.xml",
  "rules": [
    {
      "userAgent": "Googlebot",
      "allow": ["/"],
      "disallow": ["/admin/", "/private/"],
      "crawlDelay": 2
    },
    {
      "userAgent": "Bingbot",
      "allow": ["/"],
      "disallow": ["/admin/"],
      "crawlDelay": 1
    }
  ]
}
```

#### Caching

- Robots.txt is cached for 24 hours (max-age=86400)
- Changes to configuration may take up to 24 hours to propagate to cached versions
- Use cache-busting techniques if immediate updates are needed

#### Error Handling

If the database is unavailable or an error occurs, the system falls back to the default safe configuration to ensure search engines can always access robots.txt.

### 3. Canonical URL Support

Each CMS page can specify a canonical URL to prevent duplicate content issues.

#### Page Model Schema

```javascript
{
  slug: String,
  title: String,
  sections: Array,
  seo: {
    title: String,              // SEO meta title (max 60 chars)
    description: String,        // SEO meta description (max 160 chars)
    canonical: String           // Canonical URL (optional)
  },
  published: Boolean
}
```

#### Canonical URL Behavior

- **Auto-generated:** If not specified, the canonical URL is auto-generated from the page slug
- **Custom:** Administrators can specify a custom canonical URL for pages that are duplicates or variations of other content
- **Validation:** URLs are validated to ensure proper format
- **Usage:** Frontend should include canonical link tag in page `<head>`

**Example Frontend Usage:**

```html
<link rel="canonical" href="https://gnbtransfer.com/page-slug" />
```

### 4. SEO Status Indicators (Admin Panel)

The admin panel displays SEO status for each page in the Pages list:

#### Indicators

- ✓ **Complete** - Page has both SEO title and description
- ⚠ **Missing SEO title** - Page lacks an SEO title
- ⚠ **Missing SEO description** - Page lacks an SEO description

#### Best Practices

1. **SEO Title:**
   - Keep under 60 characters
   - Include primary keywords
   - Make it compelling for click-through
   - Unique for each page

2. **SEO Description:**
   - Keep under 160 characters
   - Summarize page content
   - Include call-to-action
   - Unique for each page

3. **Canonical URL:**
   - Use for duplicate or similar content
   - Point to the "master" version
   - Use absolute URLs

## Implementation Details

### Database Models

#### Page Model
Location: `/backend/models/Page.mjs`

Features:
- SEO metadata (title, description, canonical)
- Published/draft status
- Timestamps (createdAt, updatedAt)
- Unique slug validation

#### RobotsConfig Model
Location: `/backend/models/RobotsConfig.mjs`

Features:
- Singleton pattern (one config document)
- Multiple user-agent rules
- Crawl delay validation (0-60 seconds)
- Dynamic robots.txt generation

### API Routes

#### Sitemap Routes
Location: `/backend/routes/sitemapRoutes.mjs`

- `GET /api/sitemap` - Generate sitemap.xml
- `GET /api/sitemap/robots.txt` - Generate robots.txt

#### Robots Config Routes
Location: `/backend/routes/robotsConfigRoutes.mjs`

- `GET /api/admin/robots-config` - Get configuration (Admin/Manager)
- `PUT /api/admin/robots-config` - Update configuration (Admin only)
- `GET /api/admin/robots-config/preview` - Preview robots.txt (Admin/Manager)
- `POST /api/admin/robots-config/reset` - Reset to defaults (Admin only)

### Permissions

- **View Configuration:** Requires `settings.view` permission (Admin, Manager)
- **Update Configuration:** Requires `settings.update` permission (Admin only)

## Testing

### Test Coverage

Location: `/backend/tests/sitemap-robots.test.mjs`

Tests include:
- Sitemap generation with all content types
- Homepage inclusion in sitemap
- Lastmod timestamp accuracy
- Published vs. draft page filtering
- Robots.txt generation from database config
- Robots.txt fallback behavior
- Admin configuration CRUD operations
- Permission enforcement
- Input validation

### Running Tests

```bash
cd backend
npm test sitemap-robots.test.mjs
```

## Monitoring and Maintenance

### Verification

1. **Sitemap Verification:**
   - Visit: `https://yourdomain.com/sitemap.xml`
   - Validate with: [Google Search Console](https://search.google.com/search-console)
   - Check for XML errors and validate URLs

2. **Robots.txt Verification:**
   - Visit: `https://yourdomain.com/robots.txt`
   - Test with: [Google Robots Testing Tool](https://www.google.com/webmasters/tools/robots-testing-tool)
   - Verify crawl directives

3. **SEO Health:**
   - Monitor page SEO indicators in admin panel
   - Ensure all published pages have SEO metadata
   - Check for duplicate slugs

### Performance

- Sitemap is cached for 1 hour
- Robots.txt is cached for 24 hours
- Database queries use lean() for performance
- Indexes on slug and published fields

### Troubleshooting

**Sitemap shows old content:**
- Wait for cache to expire (1 hour) or clear CDN cache
- Check database for page published status

**Robots.txt changes not reflecting:**
- Wait for cache to expire (24 hours) or clear CDN cache
- Verify configuration was saved successfully
- Check for database connection issues

**SEO indicators not updating:**
- Refresh admin panel page list
- Verify page was saved with SEO metadata
- Check browser console for API errors

## Best Practices

### For Developers

1. Always include timestamps in models that appear in sitemap
2. Use proper HTTP cache headers
3. Implement error handling with fallbacks
4. Validate user input for robots configuration
5. Log admin changes for audit trail

### For Content Managers

1. Always fill in SEO title and description before publishing
2. Use canonical URLs for duplicate content
3. Review sitemap regularly in Search Console
4. Update robots.txt only when necessary
5. Test robots.txt changes with preview before saving

### For SEO

1. Submit sitemap to all major search engines
2. Monitor crawl errors in Search Console
3. Keep SEO titles under 60 characters
4. Keep descriptions under 160 characters
5. Use unique, descriptive content for each page
6. Avoid blocking important content in robots.txt

## Integration

### Search Console Setup

1. Verify domain ownership in Google Search Console
2. Submit sitemap: `https://yourdomain.com/sitemap.xml`
3. Monitor indexing status and coverage
4. Fix any crawl errors reported

### Frontend Integration

Include in page `<head>`:

```html
<!-- SEO Meta Tags -->
<title>{page.seo.title || page.title}</title>
<meta name="description" content="{page.seo.description}" />
<link rel="canonical" href="{page.seo.canonical || autoGeneratedUrl}" />

<!-- Sitemap Reference -->
<link rel="sitemap" type="application/xml" href="/sitemap.xml" />
```

## Future Enhancements

Potential improvements for consideration:

1. **Sitemap Index:** Generate sitemap index for large sites (>50,000 URLs)
2. **Image Sitemaps:** Include image references in sitemap
3. **Video Sitemaps:** Support video content in sitemap
4. **News Sitemaps:** Support Google News sitemap format
5. **Automatic Submission:** Auto-submit sitemap updates to search engines
6. **SEO Audit:** Built-in SEO audit tool for content quality
7. **Analytics Integration:** Track SEO performance metrics
8. **Schema.org Markup:** Support for structured data

## References

- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [Google Sitemap Guidelines](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Robots.txt Specification](https://www.robotstxt.org/robotstxt.html)
- [Google Robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Canonical URLs Best Practices](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
