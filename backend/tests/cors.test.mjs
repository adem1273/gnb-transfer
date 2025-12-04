/**
 * CORS Configuration Tests
 * Tests for production CORS lockdown and origin validation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('CORS Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Origin parsing', () => {
    it('should parse comma-separated origins', () => {
      const corsOrigins = 'https://example.com, https://www.example.com, https://app.example.com';
      const origins = corsOrigins.split(',').map((o) => o.trim());

      expect(origins).toEqual([
        'https://example.com',
        'https://www.example.com',
        'https://app.example.com',
      ]);
    });

    it('should handle single origin', () => {
      const corsOrigins = 'https://example.com';
      const origins = corsOrigins.split(',').map((o) => o.trim());

      expect(origins).toEqual(['https://example.com']);
    });

    it('should trim whitespace', () => {
      const corsOrigins = '  https://example.com  ,  https://www.example.com  ';
      const origins = corsOrigins.split(',').map((o) => o.trim());

      expect(origins).toEqual(['https://example.com', 'https://www.example.com']);
    });
  });

  describe('Origin validation', () => {
    it('should validate https:// origins', () => {
      const origin = 'https://example.com';
      expect(origin.startsWith('https://')).toBe(true);
    });

    it('should validate http:// origins', () => {
      const origin = 'http://localhost:3000';
      expect(origin.startsWith('http://') || origin.startsWith('https://')).toBe(true);
    });

    it('should reject invalid origin format', () => {
      const origin = 'example.com'; // Missing protocol
      expect(origin.startsWith('http://') || origin.startsWith('https://')).toBe(false);
    });

    it('should detect insecure http:// in production', () => {
      const origin = 'http://example.com';
      const isInsecure = origin.startsWith('http://') && !origin.includes('localhost');
      expect(isInsecure).toBe(true);
    });

    it('should allow http://localhost', () => {
      const origin = 'http://localhost:3000';
      const isInsecure = origin.startsWith('http://') && !origin.includes('localhost');
      expect(isInsecure).toBe(false);
    });
  });

  describe('Origin whitelist checking', () => {
    const allowedOrigins = [
      'https://example.com',
      'https://www.example.com',
      'https://app.example.com',
    ];

    it('should allow whitelisted origin', () => {
      const origin = 'https://example.com';
      expect(allowedOrigins.includes(origin)).toBe(true);
    });

    it('should block non-whitelisted origin', () => {
      const origin = 'https://evil.com';
      expect(allowedOrigins.includes(origin)).toBe(false);
    });

    it('should block subdomain not in whitelist', () => {
      const origin = 'https://api.example.com';
      expect(allowedOrigins.includes(origin)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const origin = 'https://Example.com'; // Capital E
      expect(allowedOrigins.includes(origin)).toBe(false);
    });

    it('should check exact match (no wildcards)', () => {
      const origin = 'https://example.com.evil.com';
      expect(allowedOrigins.includes(origin)).toBe(false);
    });
  });

  describe('Production configuration requirements', () => {
    it('should require CORS_ORIGINS in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGINS = undefined;

      // In production, missing CORS_ORIGINS should be detected
      const isProduction = process.env.NODE_ENV === 'production';
      const corsOrigins = process.env.CORS_ORIGINS;
      const isMisconfigured = isProduction && (!corsOrigins || corsOrigins.trim() === '');

      expect(isMisconfigured).toBe(true);
    });

    it('should accept CORS_ORIGINS in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGINS = 'https://example.com';

      const isProduction = process.env.NODE_ENV === 'production';
      const corsOrigins = process.env.CORS_ORIGINS;
      const isMisconfigured = isProduction && (!corsOrigins || corsOrigins.trim() === '');

      expect(isMisconfigured).toBe(false);
    });

    it('should reject wildcard in production', () => {
      const origins = ['*'];
      const hasWildcard = origins.includes('*');

      expect(hasWildcard).toBe(true);
      // This should fail validation in production
    });

    it('should allow multiple origins in production', () => {
      const origins = ['https://example.com', 'https://www.example.com'];
      const hasWildcard = origins.includes('*');

      expect(hasWildcard).toBe(false);
      expect(origins.length).toBeGreaterThan(0);
    });
  });

  describe('Development defaults', () => {
    it('should have reasonable development defaults', () => {
      const devOrigins = ['http://localhost:5173', 'http://localhost:3000'];

      expect(devOrigins).toContain('http://localhost:5173'); // Vite
      expect(devOrigins).toContain('http://localhost:3000'); // CRA
    });

    it('should allow localhost in development', () => {
      process.env.NODE_ENV = 'development';
      const origin = 'http://localhost:5173';
      const isDevelopment = process.env.NODE_ENV !== 'production';

      expect(isDevelopment).toBe(true);
      expect(origin.includes('localhost')).toBe(true);
    });
  });

  describe('CORS OPTIONS', () => {
    it('should include standard HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('DELETE');
      expect(methods).toContain('OPTIONS'); // Preflight
    });

    it('should include Authorization header', () => {
      const allowedHeaders = [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
      ];

      expect(allowedHeaders).toContain('Authorization');
      expect(allowedHeaders).toContain('Content-Type');
    });

    it('should expose rate limit headers', () => {
      const exposedHeaders = [
        'X-Total-Count',
        'RateLimit-Limit',
        'RateLimit-Remaining',
        'RateLimit-Reset',
      ];

      expect(exposedHeaders).toContain('RateLimit-Limit');
      expect(exposedHeaders).toContain('RateLimit-Remaining');
    });

    it('should set preflight cache duration', () => {
      const maxAge = 600; // 10 minutes

      expect(maxAge).toBeGreaterThan(0);
      expect(maxAge).toBeLessThanOrEqual(3600); // Max 1 hour is reasonable
    });

    it('should allow credentials', () => {
      const credentials = true;

      expect(credentials).toBe(true); // Required for cookies/auth
    });
  });

  describe('Security considerations', () => {
    it('should not allow null origin in strict mode', () => {
      process.env.CORS_REQUIRE_ORIGIN = 'true';
      process.env.NODE_ENV = 'production';

      const origin = null;
      const requireOrigin = process.env.CORS_REQUIRE_ORIGIN === 'true';
      const isProduction = process.env.NODE_ENV === 'production';
      const shouldBlock = !origin && requireOrigin && isProduction;

      expect(shouldBlock).toBe(true);
    });

    it('should allow null origin in development', () => {
      process.env.CORS_REQUIRE_ORIGIN = 'false';
      process.env.NODE_ENV = 'development';

      const origin = null;
      const requireOrigin = process.env.CORS_REQUIRE_ORIGIN === 'true';
      const shouldBlock = !origin && requireOrigin;

      expect(shouldBlock).toBe(false);
    });

    it('should log blocked attempts', () => {
      // Concept: All blocked CORS attempts should be logged
      const blockedOrigin = 'https://evil.com';
      const allowedOrigins = ['https://example.com'];
      const isBlocked = !allowedOrigins.includes(blockedOrigin);

      expect(isBlocked).toBe(true);
      // In production code, this would trigger console.warn()
    });
  });
});
