import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User types
export interface IUser extends Document {
  _id: Types.ObjectId;
  id?: string; // Mongoose virtual, available when document is serialized
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'superadmin' | 'manager' | 'support' | 'driver';
  phone?: string;
  isCorporate: boolean;
  corporateDetails?: ICorporateDetails;
  preferences: IUserPreferences;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ICorporateDetails {
  companyName?: string;
  taxNumber?: string;
  address?: string;
  contactPerson?: string;
  billingEmail?: string;
  paymentTerms: 'net15' | 'net30' | 'net60' | 'prepaid';
  discount: number;
  contractStartDate?: Date;
  contractEndDate?: Date;
  monthlyInvoicing: boolean;
}

export interface IUserPreferences {
  language: string;
  tourCategories: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

// Auth types
export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  tokenId: string;
  tokenHash: string;
  revoked: boolean;
  revokedReason?: string;
  revokedAt?: Date;
  expiresAt: Date;
  deviceInfo?: IDeviceInfo;
  ipAddress?: string;
  lastUsedAt: Date;
  hashToken(token: string): Promise<void>;
  verifyToken(token: string): Promise<boolean>;
  revoke(reason: string): Promise<void>;
}

export interface IDeviceInfo {
  userAgent?: string;
  platform?: string;
  browser?: string;
  os?: string;
}

export interface ITokenPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface IRefreshTokenData {
  token: string;
  tokenId: string;
}

// Tour types
export interface ITour extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  duration: number;
  maxGroupSize: number;
  location: string;
  images?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Booking types
export interface IBooking extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  tour: Types.ObjectId;
  user?: Types.ObjectId;
  date: Date;
  guests: number;
  pickupLocation?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  amount: number;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

// Coupon types
export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  validFrom: Date;
  validUntil: Date;
  active: boolean;
  applicableTours: Types.ObjectId[];
  createdBy: Types.ObjectId;
  /** Virtual property - computed based on active, dates, and usage limits */
  readonly isValid: boolean;
  canApply(bookingAmount: number, tourId?: string): { valid: boolean; reason?: string };
  calculateDiscount(bookingAmount: number): number;
}

// Express extended types
export interface AuthenticatedRequest extends Request {
  user?: ITokenPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
