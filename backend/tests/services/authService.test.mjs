import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateAccessToken, generateRefreshToken } from '../../services/authService.mjs';
import User from '../../models/User.mjs';

describe('AuthService', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123'
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT', () => {
      const token = generateAccessToken(testUser);
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should return token with tokenId', () => {
      const result = generateRefreshToken();
      expect(result.token).toContain('.');
      expect(result.tokenId).toHaveLength(32);
    });

    it('should generate unique tokens', () => {
      const t1 = generateRefreshToken();
      const t2 = generateRefreshToken();
      expect(t1.token).not.toBe(t2.token);
    });
  });
});
