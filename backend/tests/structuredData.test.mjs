/**
 * Structured Data Service Tests
 *
 * Tests for JSON-LD schema generation functionality
 *
 * Test Coverage:
 * - WebPage schema generation
 * - BreadcrumbList schema generation
 * - Organization schema generation
 * - WebSite schema generation
 * - Schema validation
 * - Error handling and edge cases
 * - Published vs unpublished page handling
 * - Enable/disable structured data toggle
 *
 * @requires jest
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateWebPageSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generatePageSchemas,
  generateHomepageSchemas,
  isStructuredDataEnabled,
} from '../services/structuredDataService.mjs';

describe('Structured Data Service', () => {
  const mockPage = {
    _id: 'test-page-id',
    slug: 'about-us',
    title: 'About Us',
    sections: [{ type: 'text', content: 'Content here' }],
    seo: {
      title: 'About Us - GNB Transfer',
      description: 'Learn more about our company and services',
    },
    published: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
  };

  const mockGlobalSettings = {
    siteName: 'GNB Transfer',
    contactEmail: 'info@gnbtransfer.com',
    contactPhone: '+90 555 123 4567',
    address: '123 Tourism Street, Istanbul, Turkey',
    logo: 'https://example.com/logo.png',
  };

  const mockHomeLayout = {
    name: 'Default Homepage',
    seo: {
      title: 'GNB Transfer - Premium Tourism Services',
      description: 'Professional airport transfers and tourism services in Turkey',
    },
    isActive: true,
  };

  describe('generateWebPageSchema', () => {
    it('should generate valid WebPage schema with all fields', () => {
      const schema = generateWebPageSchema(mockPage);

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebPage');
      expect(schema['@id']).toContain(mockPage.slug);
      expect(schema.url).toContain(mockPage.slug);
      expect(schema.name).toBe(mockPage.seo.title);
      expect(schema.headline).toBe(mockPage.seo.title);
      expect(schema.description).toBe(mockPage.seo.description);
      expect(schema.datePublished).toBeDefined();
      expect(schema.dateModified).toBeDefined();
      expect(schema.inLanguage).toBeDefined();
      expect(schema.isPartOf).toBeDefined();
      expect(schema.isPartOf['@type']).toBe('WebSite');
    });

    it('should use page title as fallback when SEO title is missing', () => {
      const pageWithoutSEO = { ...mockPage, seo: {} };
      const schema = generateWebPageSchema(pageWithoutSEO);

      expect(schema.name).toBe(mockPage.title);
      expect(schema.headline).toBe(mockPage.title);
    });

    it('should omit description when not provided', () => {
      const pageWithoutDescription = {
        ...mockPage,
        seo: { title: 'Test' },
      };
      const schema = generateWebPageSchema(pageWithoutDescription);

      expect(schema.description).toBeUndefined();
    });

    it('should add breadcrumb reference when option is provided', () => {
      const schema = generateWebPageSchema(mockPage, { breadcrumb: true });

      expect(schema.breadcrumb).toBeDefined();
      expect(schema.breadcrumb['@id']).toContain('#breadcrumb');
    });

    it('should respect custom language option', () => {
      const schema = generateWebPageSchema(mockPage, { language: 'tr' });

      expect(schema.inLanguage).toBe('tr');
    });

    it('should return null for invalid page data', () => {
      expect(generateWebPageSchema(null)).toBeNull();
      expect(generateWebPageSchema({})).toBeNull();
      expect(generateWebPageSchema({ slug: 'test' })).toBeNull();
      expect(generateWebPageSchema({ title: 'Test' })).toBeNull();
    });

    it('should sanitize text content', () => {
      const pageWithWhitespace = {
        ...mockPage,
        seo: {
          title: '  Spaced Title  ',
          description: '  Spaced Description  ',
        },
      };
      const schema = generateWebPageSchema(pageWithWhitespace);

      expect(schema.name).toBe('Spaced Title');
      expect(schema.description).toBe('Spaced Description');
    });
  });

  describe('generateBreadcrumbSchema', () => {
    it('should generate valid BreadcrumbList schema', () => {
      const schema = generateBreadcrumbSchema(mockPage);

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema['@id']).toContain('#breadcrumb');
      expect(schema.itemListElement).toBeDefined();
      expect(schema.itemListElement.length).toBeGreaterThanOrEqual(2);
    });

    it('should always include Home as first breadcrumb', () => {
      const schema = generateBreadcrumbSchema(mockPage);

      expect(schema.itemListElement[0]['@type']).toBe('ListItem');
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe('Home');
    });

    it('should include current page as second breadcrumb', () => {
      const schema = generateBreadcrumbSchema(mockPage);

      expect(schema.itemListElement[1].position).toBe(2);
      expect(schema.itemListElement[1].name).toBe(mockPage.title);
      expect(schema.itemListElement[1].item).toContain(mockPage.slug);
    });

    it('should return null for invalid page data', () => {
      expect(generateBreadcrumbSchema(null)).toBeNull();
      expect(generateBreadcrumbSchema({})).toBeNull();
    });
  });

  describe('generateOrganizationSchema', () => {
    it('should generate valid Organization schema with all fields', () => {
      const schema = generateOrganizationSchema(mockGlobalSettings);

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema['@id']).toContain('#organization');
      expect(schema.name).toBe(mockGlobalSettings.siteName);
      expect(schema.url).toBeDefined();
      expect(schema.logo).toBeDefined();
      expect(schema.logo['@type']).toBe('ImageObject');
      expect(schema.contactPoint).toBeDefined();
      expect(schema.contactPoint['@type']).toBe('ContactPoint');
      expect(schema.contactPoint.telephone).toBe(mockGlobalSettings.contactPhone);
      expect(schema.contactPoint.email).toBe(mockGlobalSettings.contactEmail);
      expect(schema.address).toBeDefined();
      expect(schema.address['@type']).toBe('PostalAddress');
    });

    it('should use default values when settings not provided', () => {
      const schema = generateOrganizationSchema({});

      expect(schema).toBeDefined();
      expect(schema.name).toBe('GNB Transfer');
      expect(schema.contactPoint.telephone).toBeDefined();
      expect(schema.contactPoint.email).toBeDefined();
    });

    it('should omit logo when not provided', () => {
      const settingsWithoutLogo = { ...mockGlobalSettings, logo: null };
      const schema = generateOrganizationSchema(settingsWithoutLogo);

      expect(schema.logo).toBeUndefined();
    });

    it('should include available languages in contact point', () => {
      const schema = generateOrganizationSchema(mockGlobalSettings);

      expect(schema.contactPoint.availableLanguage).toBeDefined();
      expect(Array.isArray(schema.contactPoint.availableLanguage)).toBe(true);
      expect(schema.contactPoint.availableLanguage.length).toBeGreaterThan(0);
    });
  });

  describe('generateWebSiteSchema', () => {
    it('should generate valid WebSite schema', () => {
      const schema = generateWebSiteSchema(mockHomeLayout, mockGlobalSettings);

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema['@id']).toContain('#website');
      expect(schema.url).toBeDefined();
      expect(schema.name).toBe(mockGlobalSettings.siteName);
      expect(schema.description).toBe(mockHomeLayout.seo.description);
      expect(schema.publisher).toBeDefined();
      expect(schema.publisher['@id']).toContain('#organization');
    });

    it('should include SearchAction for site search', () => {
      const schema = generateWebSiteSchema(mockHomeLayout, mockGlobalSettings);

      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction['@type']).toBe('SearchAction');
      expect(schema.potentialAction.target).toBeDefined();
      expect(schema.potentialAction['query-input']).toBeDefined();
    });

    it('should include multiple languages in inLanguage', () => {
      const schema = generateWebSiteSchema(mockHomeLayout, mockGlobalSettings);

      expect(schema.inLanguage).toBeDefined();
      expect(Array.isArray(schema.inLanguage)).toBe(true);
      expect(schema.inLanguage).toContain('en');
      expect(schema.inLanguage).toContain('tr');
    });

    it('should use defaults when settings not provided', () => {
      const schema = generateWebSiteSchema({}, {});

      expect(schema).toBeDefined();
      expect(schema.name).toBe('GNB Transfer');
      expect(schema.description).toBeDefined();
    });
  });

  describe('isStructuredDataEnabled', () => {
    it('should return true when structuredData.enabled is true', () => {
      const page = {
        ...mockPage,
        structuredData: { enabled: true },
      };

      expect(isStructuredDataEnabled(page)).toBe(true);
    });

    it('should return false when structuredData.enabled is false', () => {
      const page = {
        ...mockPage,
        structuredData: { enabled: false },
      };

      expect(isStructuredDataEnabled(page)).toBe(false);
    });

    it('should return true when structuredData field does not exist (backward compatibility)', () => {
      const page = { ...mockPage };
      delete page.structuredData;

      expect(isStructuredDataEnabled(page)).toBe(true);
    });

    it('should return true when structuredData is null', () => {
      const page = {
        ...mockPage,
        structuredData: null,
      };

      expect(isStructuredDataEnabled(page)).toBe(true);
    });
  });

  describe('generatePageSchemas', () => {
    it('should generate multiple schemas for published page', () => {
      const schemas = generatePageSchemas(mockPage);

      expect(Array.isArray(schemas)).toBe(true);
      expect(schemas.length).toBeGreaterThan(0);
      
      // Should include WebPage schema
      const webPageSchema = schemas.find((s) => s['@type'] === 'WebPage');
      expect(webPageSchema).toBeDefined();

      // Should include BreadcrumbList schema
      const breadcrumbSchema = schemas.find((s) => s['@type'] === 'BreadcrumbList');
      expect(breadcrumbSchema).toBeDefined();
    });

    it('should return empty array for unpublished page', () => {
      const unpublishedPage = { ...mockPage, published: false };
      const schemas = generatePageSchemas(unpublishedPage);

      expect(schemas).toEqual([]);
    });

    it('should return empty array when structured data is disabled', () => {
      const pageWithDisabledSD = {
        ...mockPage,
        structuredData: { enabled: false },
      };
      const schemas = generatePageSchemas(pageWithDisabledSD);

      expect(schemas).toEqual([]);
    });

    it('should skip breadcrumb when includeMenuItems is false', () => {
      const schemas = generatePageSchemas(mockPage, { includeMenuItems: false });

      const breadcrumbSchema = schemas.find((s) => s['@type'] === 'BreadcrumbList');
      expect(breadcrumbSchema).toBeUndefined();
    });

    it('should return empty array for invalid page data', () => {
      expect(generatePageSchemas(null)).toEqual([]);
      expect(generatePageSchemas({})).toEqual([]);
    });

    it('should pass language option to WebPage schema', () => {
      const schemas = generatePageSchemas(mockPage, { language: 'tr' });
      const webPageSchema = schemas.find((s) => s['@type'] === 'WebPage');

      expect(webPageSchema.inLanguage).toBe('tr');
    });
  });

  describe('generateHomepageSchemas', () => {
    it('should generate multiple schemas for homepage', () => {
      const schemas = generateHomepageSchemas(mockHomeLayout, mockGlobalSettings);

      expect(Array.isArray(schemas)).toBe(true);
      expect(schemas.length).toBeGreaterThan(0);

      // Should include Organization schema
      const orgSchema = schemas.find((s) => s['@type'] === 'Organization');
      expect(orgSchema).toBeDefined();

      // Should include WebSite schema
      const webSiteSchema = schemas.find((s) => s['@type'] === 'WebSite');
      expect(webSiteSchema).toBeDefined();
    });

    it('should work with minimal data', () => {
      const schemas = generateHomepageSchemas({}, {});

      expect(schemas.length).toBeGreaterThan(0);
    });

    it('should return empty array on error', () => {
      // This should not throw but return empty array
      const schemas = generateHomepageSchemas(null, null);

      expect(Array.isArray(schemas)).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should generate schemas that are valid JSON', () => {
      const schemas = generatePageSchemas(mockPage);

      schemas.forEach((schema) => {
        expect(() => JSON.stringify(schema)).not.toThrow();
        const jsonString = JSON.stringify(schema);
        expect(() => JSON.parse(jsonString)).not.toThrow();
      });
    });

    it('should not include undefined values in generated schemas', () => {
      const schema = generateWebPageSchema(mockPage);
      const schemaString = JSON.stringify(schema);

      expect(schemaString).not.toContain('undefined');
      expect(schemaString).not.toContain('null');
    });

    it('should generate schemas with required @context and @type', () => {
      const schemas = [
        generateWebPageSchema(mockPage),
        generateBreadcrumbSchema(mockPage),
        generateOrganizationSchema(mockGlobalSettings),
        generateWebSiteSchema(mockHomeLayout, mockGlobalSettings),
      ];

      schemas.forEach((schema) => {
        expect(schema['@context']).toBe('https://schema.org');
        expect(schema['@type']).toBeDefined();
      });
    });

    it('should generate unique @id for each schema type', () => {
      const webPageSchema = generateWebPageSchema(mockPage);
      const breadcrumbSchema = generateBreadcrumbSchema(mockPage);
      const orgSchema = generateOrganizationSchema(mockGlobalSettings);
      const webSiteSchema = generateWebSiteSchema(mockHomeLayout, mockGlobalSettings);

      const ids = [
        webPageSchema['@id'],
        breadcrumbSchema['@id'],
        orgSchema['@id'],
        webSiteSchema['@id'],
      ];

      // All IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing dates gracefully', () => {
      const pageWithoutDates = {
        slug: 'test',
        title: 'Test',
        published: true,
      };
      const schema = generateWebPageSchema(pageWithoutDates);

      expect(schema).toBeDefined();
      expect(schema.datePublished).toBeUndefined();
      expect(schema.dateModified).toBeUndefined();
    });

    it('should handle invalid dates gracefully', () => {
      const pageWithInvalidDates = {
        ...mockPage,
        createdAt: 'invalid-date',
        updatedAt: 'invalid-date',
      };

      expect(() => generateWebPageSchema(pageWithInvalidDates)).not.toThrow();
    });

    it('should handle special characters in text', () => {
      const pageWithSpecialChars = {
        ...mockPage,
        title: 'Test & Title "with" quotes <tag>',
        seo: {
          title: 'SEO & Title "with" quotes',
          description: 'Description & with <special> characters',
        },
      };

      const schema = generateWebPageSchema(pageWithSpecialChars);
      expect(schema).toBeDefined();
      expect(() => JSON.stringify(schema)).not.toThrow();
    });
  });
});
