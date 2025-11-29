import User from '../../models/User.mjs';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyAndRotateRefreshToken,
  revokeRefreshToken,
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

  const accessToken = generateAccessToken(user);
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

  const user = await User.create({ name, email, password });

  const accessToken = generateAccessToken(user);
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
  const result = await verifyAndRotateRefreshToken(refreshToken, getClientIP(req));
  return result;
};

export const logout = async (refreshToken) => {
  await revokeRefreshToken(refreshToken, 'logout');
};

export default { login, register, refresh, logout };
