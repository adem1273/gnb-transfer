/**
 * NoSQL Injection Protection Tests
 * Tests for sanitization middleware and validators
 */

import { describe, it, expect } from '@jest/globals';
import { containsDangerousOperators, sanitizeValue, isValidObjectId } from '../middlewares/sanitize.mjs';
import { z } from 'zod';

describe('NoSQL Injection Protection', () => {
  describe('containsDangerousOperators', () => {
    it('should detect $ne operator', () => {
      const malicious = { email: { $ne: null } };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });

    it('should detect $gt operator', () => {
      const malicious = { price: { $gt: 0 } };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });

    it('should detect $where operator', () => {
      const malicious = { $where: 'this.price > 0' };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });

    it('should detect $regex operator', () => {
      const malicious = { email: { $regex: '.*@example.com' } };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });

    it('should detect nested operators', () => {
      const malicious = {
        user: {
          email: { $ne: null },
        },
      };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });

    it('should allow safe objects', () => {
      const safe = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };
      expect(containsDangerousOperators(safe)).toBe(false);
    });

    it('should handle arrays', () => {
      const malicious = {
        emails: [{ $ne: null }, 'test@example.com'],
      };
      // Note: Arrays won't be caught by key checking, but mongo-sanitize will strip them
      expect(containsDangerousOperators(malicious)).toBe(true);
    });
  });

  describe('sanitizeValue', () => {
    it('should throw error on MongoDB operators', () => {
      const input = {
        name: 'Test',
        $ne: 'malicious',
      };

      expect(() => sanitizeValue(input)).toThrow('Dangerous operators detected');
    });

    it('should throw error on nested operators', () => {
      const input = {
        user: {
          email: 'test@example.com',
          password: { $ne: null },
        },
      };

      expect(() => sanitizeValue(input)).toThrow('Dangerous operators detected');
    });

    it('should preserve safe data', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        metadata: {
          age: 30,
          city: 'New York',
        },
      };

      const sanitized = sanitizeValue(input);
      expect(sanitized).toEqual(input);
    });

    it('should throw error on dangerous operators', () => {
      const malicious = { $where: 'this.price > 0' };
      expect(() => sanitizeValue(malicious)).toThrow('Dangerous operators detected');
    });
  });

  describe('isValidObjectId', () => {
    it('should validate correct ObjectId format', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(isValidObjectId(validId)).toBe(true);
    });

    it('should reject invalid ObjectId (too short)', () => {
      const invalidId = '507f1f77bcf86cd7994390';
      expect(isValidObjectId(invalidId)).toBe(false);
    });

    it('should reject invalid ObjectId (too long)', () => {
      const invalidId = '507f1f77bcf86cd7994390111';
      expect(isValidObjectId(invalidId)).toBe(false);
    });

    it('should reject non-hex characters', () => {
      const invalidId = '507f1f77bcf86cd79943901g';
      expect(isValidObjectId(invalidId)).toBe(false);
    });

    it('should reject injection attempts in ID', () => {
      const malicious = '507f1f77bcf86cd7$ne:null';
      expect(isValidObjectId(malicious)).toBe(false);
    });

    it('should reject object as ID', () => {
      const malicious = { $ne: null };
      expect(isValidObjectId(malicious)).toBe(false);
    });
  });

  describe('Zod Schema Protection', () => {
    it('should enforce strict object schema', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      }).strict();

      const malicious = {
        name: 'Test',
        email: 'test@example.com',
        $ne: 'injection',
      };

      expect(() => schema.parse(malicious)).toThrow();
    });

    it('should validate ObjectId format with Zod', () => {
      const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

      expect(() => objectIdSchema.parse('507f1f77bcf86cd799439011')).not.toThrow();
      expect(() => objectIdSchema.parse('invalid')).toThrow();
      expect(() => objectIdSchema.parse({ $ne: null })).toThrow();
    });

    it('should enforce enums for payment methods', () => {
      const paymentSchema = z.enum(['cash', 'card', 'stripe']);

      expect(() => paymentSchema.parse('cash')).not.toThrow();
      expect(() => paymentSchema.parse('bitcoin')).toThrow();
      expect(() => paymentSchema.parse({ $ne: null })).toThrow();
    });

    it('should validate number ranges for guests', () => {
      const guestsSchema = z.number().int().min(1).max(50);

      expect(() => guestsSchema.parse(5)).not.toThrow();
      expect(() => guestsSchema.parse(0)).toThrow();
      expect(() => guestsSchema.parse(51)).toThrow();
      expect(() => guestsSchema.parse('5')).toThrow(); // Type safety
    });

    it('should validate string lengths', () => {
      const nameSchema = z.string().min(2).max(100);

      expect(() => nameSchema.parse('John')).not.toThrow();
      expect(() => nameSchema.parse('J')).toThrow();
      expect(() => nameSchema.parse('A'.repeat(101))).toThrow();
    });
  });

  describe('Common Injection Attack Patterns', () => {
    it('should block $ne null bypass', () => {
      const malicious = {
        email: { $ne: null },
        password: { $ne: null },
      };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });

    it('should block $or array injection', () => {
      const malicious = {
        $or: [
          { email: 'admin@example.com' },
          { email: { $ne: null } },
        ],
      };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });

    it('should block $where code execution', () => {
      const malicious = {
        $where: 'this.password.length > 0',
      };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });

    it('should block $regex pattern matching', () => {
      const malicious = {
        password: { $regex: '^admin' },
      };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });

    it('should block $gt/$lt range queries', () => {
      const malicious = {
        price: { $gt: 0, $lt: 1000 },
      };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });

    it('should block $in array injection', () => {
      const malicious = {
        role: { $in: ['admin', 'superadmin'] },
      };
      expect(containsDangerousOperators(malicious)).toBe(true);
    });
  });

  describe('Safe Input Patterns', () => {
    it('should allow normal booking data', () => {
      const booking = {
        name: 'John Doe',
        email: 'john@example.com',
        tourId: '507f1f77bcf86cd799439011',
        guests: 2,
        paymentMethod: 'card',
      };
      expect(containsDangerousOperators(booking)).toBe(false);
    });

    it('should allow nested safe objects', () => {
      const data = {
        user: {
          name: 'John',
          contact: {
            email: 'john@example.com',
            phone: '+1234567890',
          },
        },
        preferences: {
          language: 'en',
          notifications: true,
        },
      };
      expect(containsDangerousOperators(data)).toBe(false);
    });

    it('should allow arrays of safe values', () => {
      const data = {
        emails: ['john@example.com', 'jane@example.com'],
        categories: ['tour', 'hotel', 'flight'],
      };
      expect(containsDangerousOperators(data)).toBe(false);
    });
  });
});
