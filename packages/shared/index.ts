/**
 * @gnb-transfer/shared
 * 
 * Shared code package for GNB Transfer web and mobile applications
 * 
 * This package provides:
 * - TypeScript types for all data models
 * - API client with JWT authentication and token refresh
 * - API endpoint functions for tours, bookings, and auth
 * - Storage utilities for AsyncStorage (mobile)
 * - Formatters for dates, currency, and phone numbers
 * - Validation schemas using Yup
 * - i18n configuration with multi-language support
 * - App constants and configuration
 */

// Types
export * from './types';

// Constants
export * from './constants';

// API
export * from './api';

// Utils
export * from './utils';

// Validators
export * from './validators';

// i18n
export * from './i18n';

// Default export
export { api as default } from './api';
