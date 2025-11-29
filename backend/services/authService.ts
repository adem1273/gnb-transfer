import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser, IRefreshTokenData, ITokenPayload, IDeviceInfo } from '../types/index.js';
import { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not set!');
  process.exit(1);
}

// Type assertion needed as environment variable is string but jwt.sign expects StringValue
const ACCESS_TOKEN_EXPIRY: SignOptions['expiresIn'] = (process.env.ACCESS_TOKEN_EXPIRY ||
  '15m') as SignOptions['expiresIn'];

export const generateAccessToken = (user: IUser): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  // Use _id (Mongoose Document) or id (serialized form) - both are valid
  const userId = user._id?.toString() || user.id;
  if (!userId) {
    throw new Error('User ID is required to generate access token');
  }

  const payload: Omit<ITokenPayload, 'iat' | 'exp'> = {
    id: userId,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (): IRefreshTokenData => {
  const tokenId = crypto.randomBytes(16).toString('hex');
  const randomPart = crypto.randomBytes(48).toString('hex');
  return {
    token: `${tokenId}.${randomPart}`,
    tokenId,
  };
};

export const getDeviceInfo = (req: Request): IDeviceInfo => {
  const userAgent = req.headers['user-agent'] || '';

  const deviceInfo: IDeviceInfo = {
    userAgent,
    platform: (req.headers['sec-ch-ua-platform'] as string) || 'unknown',
    browser: 'unknown',
    os: 'unknown',
  };

  if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
  else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
  else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';

  if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
  else if (userAgent.includes('Mac')) deviceInfo.os = 'macOS';
  else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
  else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
  else if (userAgent.includes('iOS')) deviceInfo.os = 'iOS';

  return deviceInfo;
};

export const getClientIP = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  return (
    (req.headers['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

export default {
  generateAccessToken,
  generateRefreshToken,
  getDeviceInfo,
  getClientIP,
};
