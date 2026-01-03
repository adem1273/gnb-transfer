/**
 * Utils module exports
 *
 * Note: tokenStorage exports are preferred over storage exports for token operations
 * because tokenStorage uses expo-secure-store for enhanced security.
 * The storage module is kept for backwards compatibility with non-token storage operations.
 */

// Storage utilities - exclude token-related exports to avoid conflicts with tokenStorage
export {
  setUser,
  getUser,
  clearUser,
  clearAuth,
  getLanguage,
  setLanguage,
  isOnboardingComplete,
  setOnboardingComplete,
  getItem,
  setItem,
  removeItem,
  clearAll,
  // Legacy token functions kept for non-secure contexts
  // Use tokenStorage functions instead for secure token operations
  setToken,
  getToken,
} from './storage';

// Formatters
export * from './formatters';

// Secure token storage - preferred for all token operations
export {
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  tokenStorage,
} from './tokenStorage';

// Default exports
export { default as storage } from './storage';
export { default as formatters } from './formatters';
export { default as tokenStorage } from './tokenStorage';
