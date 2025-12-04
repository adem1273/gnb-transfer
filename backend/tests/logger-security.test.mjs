/**
 * Logger Security Tests
 * Tests for PII/sensitive data redaction in logs
 */

import { describe, it, expect } from '@jest/globals';
import fastRedact from 'fast-redact';

describe('Logger Security - Redaction Tests', () => {
  // Create redact function with same configuration as production logger
  const redact = fastRedact({
    paths: [
      'authorization',
      'headers.authorization',
      'request.headers.authorization',
      'token',
      'accessToken',
      'refreshToken',
      'password',
      'newPassword',
      'oldPassword',
      'user.newPassword',
      'user.oldPassword',
      'user.password',
      'request.body.user.password',
      'email',
      'user.email',
      'request.body.user.email',
      'creditCard',
      'cardNumber',
      'cvv',
      'payment.creditCard',
      'payment.cvv',
      'apiKey',
      'config.apiKey',
      'secret',
      'config.secret',
      'env.MONGO_URI',
      'env.JWT_SECRET',
      'MONGO_URI',
      'JWT_SECRET',
    ],
    censor: '[REDACTED]',
    serialize: true,
  });

  const testRedaction = (obj) => {
    return JSON.parse(redact(obj));
  };

  it('should redact password fields', () => {
    const testData = {
      user: 'testuser',
      password: 'supersecret123',
      action: 'login',
    };

    const redacted = testRedaction(testData);
    
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.user).toBe('testuser');
    expect(redacted.action).toBe('login');
  });

  it('should redact nested password fields', () => {
    const testData = {
      user: {
        username: 'testuser',
        newPassword: 'newsecret456',
        oldPassword: 'oldsecret123',
      },
    };

    const redacted = testRedaction(testData);
    
    expect(redacted.user.newPassword).toBe('[REDACTED]');
    expect(redacted.user.oldPassword).toBe('[REDACTED]');
    expect(redacted.user.username).toBe('testuser');
  });

  it('should redact authorization tokens', () => {
    const testData = {
      headers: {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'content-type': 'application/json',
      },
      method: 'GET',
      url: '/api/users/profile',
    };

    const redacted = testRedaction(testData);
    
    expect(redacted.headers.authorization).toBe('[REDACTED]');
    expect(redacted.headers['content-type']).toBe('application/json');
    expect(redacted.method).toBe('GET');
  });

  it('should redact access tokens', () => {
    const testData = {
      accessToken: 'at_1234567890abcdef',
      refreshToken: 'rt_0987654321fedcba',
      userId: '507f1f77bcf86cd799439011',
    };

    const redacted = testRedaction(testData);
    
    expect(redacted.accessToken).toBe('[REDACTED]');
    expect(redacted.refreshToken).toBe('[REDACTED]');
    expect(redacted.userId).toBe('507f1f77bcf86cd799439011');
  });

  it('should redact email addresses', () => {
    const testData = {
      user: {
        username: 'john',
        email: 'john@example.com',
        role: 'user',
      },
    };

    const redacted = testRedaction(testData);
    
    expect(redacted.user.email).toBe('[REDACTED]');
    expect(redacted.user.username).toBe('john');
    expect(redacted.user.role).toBe('user');
  });

  it('should redact credit card information', () => {
    const testData = {
      payment: {
        creditCard: '4111111111111111',
        cvv: '123',
        amount: 100,
      },
    };

    const redacted = testRedaction(testData);
    
    expect(redacted.payment.creditCard).toBe('[REDACTED]');
    expect(redacted.payment.cvv).toBe('[REDACTED]');
    expect(redacted.payment.amount).toBe(100);
  });

  it('should redact API keys and secrets', () => {
    const testData = {
      config: {
        apiKey: 'sk-1234567890abcdefghijklmnop',
        secret: 'secret_key_value',
        endpoint: 'https://api.example.com',
      },
    };

    const redacted = testRedaction(testData);
    
    expect(redacted.config.apiKey).toBe('[REDACTED]');
    expect(redacted.config.secret).toBe('[REDACTED]');
    expect(redacted.config.endpoint).toBe('https://api.example.com');
  });

  it('should redact environment secrets', () => {
    const testData = {
      env: {
        MONGO_URI: 'mongodb+srv://user:password@cluster.mongodb.net/db',
        JWT_SECRET: 'supersecretjwtkey',
        PORT: '5000',
      },
    };

    const redacted = testRedaction(testData);
    
    expect(redacted.env.MONGO_URI).toBe('[REDACTED]');
    expect(redacted.env.JWT_SECRET).toBe('[REDACTED]');
    expect(redacted.env.PORT).toBe('5000');
  });

  it('should preserve non-sensitive data', () => {
    const testData = {
      userId: '507f1f77bcf86cd799439011',
      action: 'view_profile',
      timestamp: '2024-01-01T00:00:00Z',
      ipAddress: '192.168.1.1',
    };

    const redacted = testRedaction(testData);
    
    expect(redacted.userId).toBe('507f1f77bcf86cd799439011');
    expect(redacted.action).toBe('view_profile');
    expect(redacted.timestamp).toBe('2024-01-01T00:00:00Z');
    expect(redacted.ipAddress).toBe('192.168.1.1');
  });

  it('should handle complex nested objects with mixed sensitive data', () => {
    const testData = {
      request: {
        headers: {
          authorization: 'Bearer secret_token',
          'user-agent': 'Mozilla/5.0',
        },
        body: {
          user: {
            email: 'test@example.com',
            name: 'Test User',
            password: 'secret123',
          },
          metadata: {
            sessionId: 'sess_123',
            deviceId: 'device_456',
          },
        },
      },
    };

    const redacted = testRedaction(testData);
    
    // Sensitive data redacted
    expect(redacted.request.headers.authorization).toBe('[REDACTED]');
    expect(redacted.request.body.user.email).toBe('[REDACTED]');
    expect(redacted.request.body.user.password).toBe('[REDACTED]');
    // Non-sensitive data preserved
    expect(redacted.request.body.user.name).toBe('Test User');
    expect(redacted.request.body.metadata.sessionId).toBe('sess_123');
    expect(redacted.request.body.metadata.deviceId).toBe('device_456');
    expect(redacted.request.headers['user-agent']).toBe('Mozilla/5.0');
  });
});

describe('Logger Exception Handlers', () => {
  it('should have exception handlers configured', async () => {
    // Import actual logger
    const logger = (await import('../config/logger.mjs')).default;
    
    // Check that logger has exception handlers
    expect(logger.exceptions).toBeDefined();
    expect(logger.exceptions.handle).toBeDefined();
  });

  it('should have rejection handlers configured', async () => {
    // Import actual logger
    const logger = (await import('../config/logger.mjs')).default;
    
    // Check that logger has rejection handlers  
    expect(logger.rejections).toBeDefined();
    expect(logger.rejections.handle).toBeDefined();
  });
});
