/**
 * Shared constants for GNB Transfer
 * These constants are shared between web and mobile applications
 */

// API base paths
export const API_VERSION = 'v1';

// Default API URL - will be overridden by environment config
export const DEFAULT_API_URL = 'http://localhost:5000/api';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/users/login',
    REGISTER: '/users/register',
    LOGOUT: '/users/logout',
    REFRESH: '/users/refresh',
    PROFILE: '/users/profile',
    FORGOT_PASSWORD: '/users/forgot-password',
    RESET_PASSWORD: '/users/reset-password',
    GOOGLE_AUTH: '/users/google-auth',
    APPLE_AUTH: '/users/apple-auth',
  },
  // Tours
  TOURS: {
    BASE: '/tours',
    CAMPAIGNS: '/tours/campaigns',
    MOST_POPULAR: '/tours/most-popular',
  },
  // Bookings
  BOOKINGS: {
    BASE: '/bookings',
    CALENDAR: '/bookings/calendar',
  },
  // Users
  USERS: {
    BASE: '/users',
    BOOKINGS: '/users/bookings',
    PERMISSIONS: '/users/permissions',
  },
  // Reviews
  REVIEWS: {
    BASE: '/reviews',
  },
  // Blog
  BLOG: {
    BASE: '/blog',
  },
  // Drivers
  DRIVERS: {
    BASE: '/drivers',
  },
  // Vehicles
  VEHICLES: {
    BASE: '/vehicles',
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  LANGUAGE: 'i18nextLng',
  THEME: 'theme',
  ONBOARDING_COMPLETE: 'onboardingComplete',
} as const;

// Booking statuses
export const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  PAID: 'paid',
} as const;

export type BookingStatus = typeof BOOKING_STATUSES[keyof typeof BOOKING_STATUSES];

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  STRIPE: 'stripe',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Tour categories
export const TOUR_CATEGORIES = {
  TRANSFER: 'transfer',
  TOUR: 'tour',
  VIP: 'vip',
  AIRPORT: 'airport',
  CITY: 'city',
  EXCURSION: 'excursion',
  PACKAGE: 'package',
} as const;

export type TourCategory = typeof TOUR_CATEGORIES[keyof typeof TOUR_CATEGORIES];

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  MANAGER: 'manager',
  SUPPORT: 'support',
  DRIVER: 'driver',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', nativeName: 'العربية', rtl: true },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'es', label: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'zh', label: '中文', flag: '🇨🇳', nativeName: '简体中文' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷', nativeName: 'فارسی', rtl: true },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳', nativeName: 'हिंदी' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// RTL languages
export const RTL_LANGUAGES = ['ar', 'fa'] as const;

// Default language
export const DEFAULT_LANGUAGE = 'tr';

// Fallback language
export const FALLBACK_LANGUAGE = 'en';

// Validation constants
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PHONE: {
    MIN_DIGITS: 10,
  },
  GUESTS: {
    MIN: 1,
    MAX: 50,
  },
  NOTES: {
    MAX_LENGTH: 500,
  },
} as const;

// Passenger types
export const PASSENGER_TYPES = {
  ADULT: 'adult',
  CHILD: 'child',
  INFANT: 'infant',
} as const;

export type PassengerType = typeof PASSENGER_TYPES[keyof typeof PASSENGER_TYPES];

// Extra services
export const EXTRA_SERVICES = {
  CHILD_SEAT: {
    key: 'childSeat',
    defaultPrice: 10,
  },
  BABY_SEAT: {
    key: 'babySeat',
    defaultPrice: 10,
  },
  MEET_AND_GREET: {
    key: 'meetAndGreet',
    defaultPrice: 15,
  },
  VIP_LOUNGE: {
    key: 'vipLounge',
    defaultPrice: 50,
  },
} as const;

// Default country code
export const DEFAULT_COUNTRY_CODE = '+90';

// Token expiry times (in seconds)
export const TOKEN_EXPIRY = {
  ACCESS: 15 * 60, // 15 minutes
  REFRESH: 30 * 24 * 60 * 60, // 30 days
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;

// App configuration
export const APP_CONFIG = {
  APP_NAME: 'GNB Transfer',
  APP_DESCRIPTION: 'Professional tourism and transfer services',
  SUPPORT_EMAIL: 'support@gnbtransfer.com',
  SUPPORT_PHONE: '+90 555 123 4567',
  WHATSAPP_BASE_URL: 'https://wa.me/',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
