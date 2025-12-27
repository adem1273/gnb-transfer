#!/usr/bin/env node

/**
 * Manual Test Script for SEO Infrastructure
 * 
 * Tests the sitemap and robots.txt endpoints without requiring a full test environment
 */

import Page from '../models/Page.mjs';
import RobotsConfig from '../models/RobotsConfig.mjs';

console.log('🧪 Testing SEO Infrastructure Models\n');

// Test 1: Page model with canonical URL
console.log('Test 1: Page model with canonical URL');
try {
  const pageData = {
    slug: 'test-page',
    title: 'Test Page',
    seo: {
      title: 'Test SEO Title',
      description: 'Test SEO Description',
      canonical: 'https://example.com/test-page',
    },
    published: true,
  };
  
  const page = new Page(pageData);
  const validationError = page.validateSync();
  
  if (validationError) {
    console.log('❌ Page model validation failed:', validationError.message);
  } else {
    console.log('✅ Page model with canonical URL is valid');
    console.log('   - Slug:', page.slug);
    console.log('   - SEO Title:', page.seo.title);
    console.log('   - SEO Description:', page.seo.description);
    console.log('   - Canonical:', page.seo.canonical);
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('\nTest 2: Page model with invalid canonical URL');
try {
  const invalidPage = new Page({
    slug: 'invalid-page',
    title: 'Invalid Page',
    seo: {
      canonical: 'not-a-valid-url',
    },
  });
  
  const validationError = invalidPage.validateSync();
  
  if (validationError && validationError.message.includes('Canonical')) {
    console.log('✅ Invalid canonical URL properly rejected');
  } else {
    console.log('❌ Invalid canonical URL was not caught');
  }
} catch (error) {
  console.log('✅ Invalid canonical URL properly rejected:', error.message);
}

// Test 3: RobotsConfig model
console.log('\nTest 3: RobotsConfig model with default rules');
try {
  const config = new RobotsConfig({});
  const validationError = config.validateSync();
  
  if (validationError) {
    console.log('❌ RobotsConfig validation failed:', validationError.message);
  } else {
    console.log('✅ RobotsConfig model is valid');
    console.log('   - Enabled:', config.enabled);
    console.log('   - Sitemap URL:', config.sitemapUrl);
    console.log('   - Rules count:', config.rules.length);
    if (config.rules.length > 0) {
      console.log('   - First rule user-agent:', config.rules[0].userAgent);
    }
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}

// Test 4: RobotsConfig generateRobotsTxt method
console.log('\nTest 4: RobotsConfig generateRobotsTxt method');
try {
  const config = new RobotsConfig({
    enabled: true,
    rules: [
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: ['/admin/', '/private/'],
        crawlDelay: 2,
      },
    ],
  });
  
  const robotsTxt = config.generateRobotsTxt('https://gnbtransfer.com');
  
  if (robotsTxt.includes('User-agent: Googlebot') &&
      robotsTxt.includes('Disallow: /admin/') &&
      robotsTxt.includes('Crawl-delay: 2') &&
      robotsTxt.includes('Sitemap:')) {
    console.log('✅ Robots.txt generation successful');
    console.log('\nGenerated robots.txt:');
    console.log('---');
    console.log(robotsTxt);
    console.log('---');
  } else {
    console.log('❌ Robots.txt generation incomplete');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}

// Test 5: RobotsConfig with invalid crawl delay
console.log('\nTest 5: RobotsConfig with invalid crawl delay');
try {
  const invalidConfig = new RobotsConfig({
    rules: [
      {
        userAgent: '*',
        crawlDelay: 100, // Invalid: > 60
      },
    ],
  });
  
  const validationError = invalidConfig.validateSync();
  
  if (validationError && validationError.message.includes('60')) {
    console.log('✅ Invalid crawl delay properly rejected');
  } else {
    console.log('❌ Invalid crawl delay was not caught');
  }
} catch (error) {
  console.log('✅ Invalid crawl delay properly rejected');
}

console.log('\n✨ All model tests completed!\n');
console.log('📝 Note: Database integration tests require MongoDB connection.');
console.log('   Run full test suite with: npm test sitemap-robots.test.mjs\n');
