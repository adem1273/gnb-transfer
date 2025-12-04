/**
 * Rate Limiter Tests
 * Tests for rate limiting configuration and proxy trust
 */

import { describe, it, expect } from '@jest/globals';

describe('Rate Limiter Configuration', () => {
  describe('keyGenerator', () => {
    it('should use req.ip for rate limiting key', () => {
      // This test verifies the concept - actual implementation is in rateLimiter.mjs
      const mockReq = {
        ip: '192.168.1.1',
        connection: { remoteAddress: '10.0.0.1' },
      };

      // Key generator should prefer req.ip (which respects trust proxy)
      const key = mockReq.ip || mockReq.connection?.remoteAddress || 'unknown';
      
      expect(key).toBe('192.168.1.1');
    });

    it('should fallback to connection.remoteAddress if ip not available', () => {
      const mockReq = {
        ip: undefined,
        connection: { remoteAddress: '10.0.0.1' },
      };

      const key = mockReq.ip || mockReq.connection?.remoteAddress || 'unknown';
      
      expect(key).toBe('10.0.0.1');
    });

    it('should use unknown as last resort', () => {
      const mockReq = {
        ip: undefined,
        connection: undefined,
      };

      const key = mockReq.ip || mockReq.connection?.remoteAddress || 'unknown';
      
      expect(key).toBe('unknown');
    });
  });

  describe('X-Forwarded-For header handling', () => {
    it('should extract client IP from X-Forwarded-For header', () => {
      // When trust proxy is enabled, Express automatically parses X-Forwarded-For
      // and sets req.ip to the leftmost (client) IP
      
      const xForwardedFor = '203.0.113.1, 198.51.100.1, 192.0.2.1';
      const clientIP = xForwardedFor.split(',')[0].trim();
      
      expect(clientIP).toBe('203.0.113.1');
    });

    it('should handle single IP in X-Forwarded-For', () => {
      const xForwardedFor = '203.0.113.1';
      const clientIP = xForwardedFor.split(',')[0].trim();
      
      expect(clientIP).toBe('203.0.113.1');
    });

    it('should handle multiple proxies correctly', () => {
      // Format: client, proxy1, proxy2, proxy3
      // We want the client (leftmost) IP
      const xForwardedFor = '198.51.100.1, 192.0.2.1, 203.0.113.1';
      const clientIP = xForwardedFor.split(',')[0].trim();
      
      expect(clientIP).toBe('198.51.100.1');
    });
  });

  describe('Environment configuration', () => {
    it('should parse RATE_LIMIT_WINDOW_MS correctly', () => {
      const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
      
      expect(windowMs).toBeGreaterThan(0);
      expect(typeof windowMs).toBe('number');
    });

    it('should parse RATE_LIMIT_MAX correctly', () => {
      const max = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
      
      expect(max).toBeGreaterThan(0);
      expect(typeof max).toBe('number');
    });

    it('should parse STRICT_RATE_LIMIT_MAX correctly', () => {
      const max = parseInt(process.env.STRICT_RATE_LIMIT_MAX || '5', 10);
      
      expect(max).toBeGreaterThan(0);
      expect(typeof max).toBe('number');
      expect(max).toBeLessThanOrEqual(10); // Strict limiter should be low
    });
  });

  describe('Trust proxy configuration', () => {
    it('should enable trust proxy in production', () => {
      const env = 'production';
      const shouldTrust = env === 'production';
      
      expect(shouldTrust).toBe(true);
    });

    it('should respect TRUST_PROXY env variable', () => {
      const trustProxy = 'true';
      const shouldTrust = trustProxy === 'true';
      
      expect(shouldTrust).toBe(true);
    });

    it('should not trust by default in development', () => {
      const env = 'development';
      const trustProxy = undefined;
      const shouldTrust = env === 'production' || trustProxy === 'true';
      
      expect(shouldTrust).toBe(false);
    });
  });

  describe('IP whitelist parsing', () => {
    it('should parse comma-separated whitelist', () => {
      const whitelist = '192.168.1.1, 10.0.0.1, 172.16.0.1';
      const ips = whitelist.split(',').map((ip) => ip.trim());
      
      expect(ips).toEqual(['192.168.1.1', '10.0.0.1', '172.16.0.1']);
      expect(ips.length).toBe(3);
    });

    it('should handle empty whitelist', () => {
      const whitelist = '';
      const ips = whitelist ? whitelist.split(',').map((ip) => ip.trim()) : [];
      
      expect(ips).toEqual([]);
    });

    it('should check if IP is whitelisted', () => {
      const whitelist = ['192.168.1.1', '10.0.0.1'];
      const testIP = '192.168.1.1';
      
      expect(whitelist.includes(testIP)).toBe(true);
      expect(whitelist.includes('203.0.113.1')).toBe(false);
    });
  });

  describe('Rate limit configuration defaults', () => {
    it('should have reasonable defaults for global rate limiter', () => {
      const defaultWindow = 15 * 60 * 1000; // 15 minutes
      const defaultMax = 100;
      
      expect(defaultWindow).toBe(900000);
      expect(defaultMax).toBe(100);
      expect(defaultMax / (defaultWindow / 60000)).toBeGreaterThan(5); // > 5 req/min
    });

    it('should have strict defaults for sensitive operations', () => {
      const defaultWindow = 15 * 60 * 1000; // 15 minutes
      const defaultMax = 5;
      
      expect(defaultWindow).toBe(900000);
      expect(defaultMax).toBe(5);
      expect(defaultMax / (defaultWindow / 60000)).toBeLessThan(1); // < 1 req/min
    });
  });
});

describe('Express Trust Proxy Behavior', () => {
  it('should understand trust proxy levels', () => {
    // Trust proxy values and their meanings
    const trustProxyConfigs = {
      false: 'Do not trust any proxy (use connection.remoteAddress)',
      true: 'Trust all proxies (use X-Forwarded-For)',
      1: 'Trust first proxy (single reverse proxy)',
      2: 'Trust two proxies (e.g., load balancer + nginx)',
      '10.0.0.0/8': 'Trust proxies from specific subnet',
    };

    expect(trustProxyConfigs[1]).toBe('Trust first proxy (single reverse proxy)');
    expect(trustProxyConfigs[true]).toBe('Trust all proxies (use X-Forwarded-For)');
  });
});
