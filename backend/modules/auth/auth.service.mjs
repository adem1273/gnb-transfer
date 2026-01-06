import User from '../../models/User.mjs';
import RefreshToken from '../../models/RefreshToken.mjs';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyAndRotateRefreshToken,
  logout as logoutService,
  getDeviceInfo,
  getClientIP,
} from '../../services/authService.mjs';
import { generateDeviceFingerprint } from '../../utils/deviceFingerprint.mjs';
import { SESSION } from '../../constants/limits.mjs';

export const login = async (email, password, req) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Session limit check - enforce max concurrent sessions
  const activeSessionCount = await RefreshToken.countDocuments({
    userId: user._id,
    revoked: false,
    expiresAt: { $gt: new Date() }
  });

  if (activeSessionCount >= SESSION.MAX_CONCURRENT) {
    // Revoke the oldest session to make room
    const oldestSession = await RefreshToken.findOne({
      userId: user._id,
      revoked: false
    }).sort({ createdAt: 1 });
    
    if (oldestSession) {
      oldestSession.revoked = true;
      oldestSession.revokedReason = 'max_sessions';
      oldestSession.revokedAt = new Date();
      await oldestSession.save();
    }
  }

  // Generate device fingerprint for token binding
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

  // Generate device fingerprint for token binding
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
  const result = await verifyAndRotateRefreshToken(refreshToken, getClientIP(req), req);
  return result;
};

export const logout = async (refreshToken, accessToken) => {
  await logoutService(refreshToken, accessToken);
};

export default { login, register, refresh, logout };
