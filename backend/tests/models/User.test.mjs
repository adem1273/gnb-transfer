import { describe, it, expect } from '@jest/globals';
import User from '../../models/User.mjs';

describe('User Model', () => {
  it('should hash password before saving', async () => {
    const user = await User.create({
      name: 'Test',
      email: 'hash@test.com',
      password: 'TestPass123'
    });
    expect(user.password).not.toBe('TestPass123');
    expect(user.password.startsWith('$2')).toBe(true);
  });

  it('should compare password correctly', async () => {
    const user = await User.create({
      name: 'Test',
      email: 'compare@test.com',
      password: 'TestPass123'
    });
    expect(await user.comparePassword('TestPass123')).toBe(true);
    expect(await user.comparePassword('Wrong')).toBe(false);
  });

  it('should enforce password policy', async () => {
    const user = new User({
      name: 'Test',
      email: 'weak@test.com',
      password: 'weak'
    });
    await expect(user.save()).rejects.toThrow();
  });
});
