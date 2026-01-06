import User from '../../models/User.mjs';
import RefreshToken from '../../models/RefreshToken.mjs';
import { SESSION } from '../../constants/limits.mjs';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyAndRotateRefreshToken,
  revokeRefreshToken,
  logout as logoutService,
  getDeviceInfo,
  getClientIP,
} from '../../services/authService.mjs';

export const login = async (email, password, req) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Check concurrent session limit
  const activeSessions = await RefreshToken.countDocuments({
    userId: user._id,
    revoked: false,
    expiresAt: { $gt: new Date() }
  });

  if (activeSessions >= SESSION.MAX_CONCURRENT) {
    // Revoke oldest session when limit exceeded
    const oldestSession = await RefreshToken.findOne({
      userId: user._id,
      revoked: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: 1 });

    if (oldestSession) {
      oldestSession.revoked = true;
      oldestSession.revokedReason = 'max_sessions_exceeded';
      oldestSession.revokedAt = new Date();
      await oldestSession.save();

      // Also revoke the access token if we have tokenId
      if (oldestSession.tokenId) {
        try {
          const redis = await import('../../config/redis.mjs').then(m => m.getRedisClient());
          if (redis) {
            // Revoke for 15 minutes (max access token lifetime)
            await redis.setex(`revoked:${oldestSession.tokenId}`, 900, '1');
          }
        } catch (redisError) {
          console.warn('Failed to revoke old session access token in Redis:', redisError.message);
        }
      }
    }
  }

  // Generate device fingerprint
  const { generateDeviceFingerprint } = await import('../../utils/deviceFingerprint.mjs');
  const deviceFingerprint = generateDeviceFingerprint(req);

  const accessToken = generateAccessToken(user, deviceFingerprint);
  const refreshTokenData = generateRefreshToken();

  await storeRefreshToken(
    user._id,
    refreshTokenData,
    getDeviceInfo(req),
    getClientIP(req)
  );

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken: refreshTokenData.token,
  };
};

export const register = async (userData, req) => {
  const { name, email, password } = userData;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const user = await User.create({ name, email: email.toLowerCase(), password });

  // Generate device fingerprint
  const { generateDeviceFingerprint } = await import('../../utils/deviceFingerprint.mjs');
  const deviceFingerprint = generateDeviceFingerprint(req);

  const accessToken = generateAccessToken(user, deviceFingerprint);
  const refreshTokenData = generateRefreshToken();

  await storeRefreshToken(
    user._id,
    refreshTokenData,
    getDeviceInfo(req),
    getClientIP(req)
  );

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken: refreshTokenData.token,
  };
};

export const refresh = async (refreshToken, req) => {
  // Generate device fingerprint for new access token
  const { generateDeviceFingerprint } = await import('../../utils/deviceFingerprint.mjs');
  const deviceFingerprint = generateDeviceFingerprint(req);
  
  const result = await verifyAndRotateRefreshToken(refreshToken, getClientIP(req), deviceFingerprint);
  return result;
};

export const logout = async (refreshToken, accessToken = null) => {
  await logoutService(refreshToken, accessToken);
};

export default { login, register, refresh, logout };
