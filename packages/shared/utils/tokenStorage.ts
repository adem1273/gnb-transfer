/**
 * Secure Token Storage Abstraction
 *
 * This module provides a secure abstraction layer for storing authentication tokens
 * using expo-secure-store instead of AsyncStorage.
 *
 * WHY SECURESTORE OVER ASYNCSTORAGE:
 * - SecureStore uses OS-level encryption (iOS Keychain, Android Keystore)
 * - Data is isolated per app and cannot be accessed by other apps
 * - Provides hardware-backed security on supported devices
 * - Protects sensitive tokens from device compromise or malware
 * - AsyncStorage stores data in plain text, making tokens vulnerable
 *
 * SECURITY BENEFITS:
 * - iOS: Uses Keychain Services with ALWAYS_THIS_DEVICE_ONLY accessibility
 *   (tokens cannot be backed up or transferred to another device)
 * - Android: Uses Android Keystore for hardware-backed encryption
 * - Both platforms ensure tokens are encrypted at rest
 * - App isolation prevents cross-app data access
 *
 * IMPORTANT: This module should be the ONLY place that directly accesses SecureStore
 * for token operations. All other code should use this abstraction.
 */

// Token storage keys - using consistent naming convention
export const ACCESS_TOKEN_KEY = 'auth.accessToken';
export const REFRESH_TOKEN_KEY = 'auth.refreshToken';

// Types for SecureStore operations
interface SecureStoreModule {
  setItemAsync(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
  getItemAsync(key: string, options?: SecureStoreOptions): Promise<string | null>;
  deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void>;
}

interface SecureStoreOptions {
  keychainAccessible?: number;
}

interface SecureStoreConstants {
  ALWAYS_THIS_DEVICE_ONLY: number;
}

// SecureStore module reference (lazy loaded)
let SecureStore: SecureStoreModule | null = null;
let SecureStoreConstants: SecureStoreConstants | null = null;

/**
 * Initialize SecureStore module
 * Falls back gracefully if not available (e.g., in web environment)
 */
const getSecureStore = (): SecureStoreModule | null => {
  if (SecureStore !== null) {
    return SecureStore;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const secureStoreModule = require('expo-secure-store');
    SecureStore = secureStoreModule;
    SecureStoreConstants = secureStoreModule;
    return SecureStore;
  } catch {
    // SecureStore not available - this is expected in web environment
    return null;
  }
};

/**
 * Get SecureStore options for the current platform
 * iOS: Use ALWAYS_THIS_DEVICE_ONLY for maximum security
 * Android: Default Keystore usage (no special options needed)
 */
const getSecureStoreOptions = (): SecureStoreOptions | undefined => {
  if (SecureStoreConstants?.ALWAYS_THIS_DEVICE_ONLY !== undefined) {
    return {
      keychainAccessible: SecureStoreConstants.ALWAYS_THIS_DEVICE_ONLY,
    };
  }
  return undefined;
};

/**
 * Clear all tokens from secure storage
 * This is called when any SecureStore operation fails to avoid inconsistent auth state
 *
 * @internal This function should not throw to avoid cascading failures
 */
const clearAllTokensInternal = async (): Promise<void> => {
  const store = getSecureStore();
  if (!store) return;

  const options = getSecureStoreOptions();

  try {
    await store.deleteItemAsync(ACCESS_TOKEN_KEY, options);
  } catch {
    // Silently fail - we're already in an error state
  }

  try {
    await store.deleteItemAsync(REFRESH_TOKEN_KEY, options);
  } catch {
    // Silently fail - we're already in an error state
  }
};

/**
 * Set the access token in secure storage
 *
 * @param token - JWT access token to store
 * @throws Never throws - clears all tokens on failure to maintain consistent state
 */
export const setAccessToken = async (token: string): Promise<void> => {
  const store = getSecureStore();
  if (!store) {
    // No secure storage available - fail silently in non-mobile environments
    return;
  }

  try {
    const options = getSecureStoreOptions();
    await store.setItemAsync(ACCESS_TOKEN_KEY, token, options);
  } catch {
    // On any failure, clear all tokens to avoid inconsistent auth state
    // Never log the token value for security reasons
    await clearAllTokensInternal();
  }
};

/**
 * Get the access token from secure storage
 *
 * @returns JWT access token or null if not found or on error
 */
export const getAccessToken = async (): Promise<string | null> => {
  const store = getSecureStore();
  if (!store) {
    return null;
  }

  try {
    const options = getSecureStoreOptions();
    return await store.getItemAsync(ACCESS_TOKEN_KEY, options);
  } catch {
    // On any failure, clear all tokens to avoid inconsistent auth state
    await clearAllTokensInternal();
    return null;
  }
};

/**
 * Set the refresh token in secure storage
 *
 * @param token - JWT refresh token to store
 * @throws Never throws - clears all tokens on failure to maintain consistent state
 */
export const setRefreshToken = async (token: string): Promise<void> => {
  const store = getSecureStore();
  if (!store) {
    // No secure storage available - fail silently in non-mobile environments
    return;
  }

  try {
    const options = getSecureStoreOptions();
    await store.setItemAsync(REFRESH_TOKEN_KEY, token, options);
  } catch {
    // On any failure, clear all tokens to avoid inconsistent auth state
    // Never log the token value for security reasons
    await clearAllTokensInternal();
  }
};

/**
 * Get the refresh token from secure storage
 *
 * @returns JWT refresh token or null if not found or on error
 */
export const getRefreshToken = async (): Promise<string | null> => {
  const store = getSecureStore();
  if (!store) {
    return null;
  }

  try {
    const options = getSecureStoreOptions();
    return await store.getItemAsync(REFRESH_TOKEN_KEY, options);
  } catch {
    // On any failure, clear all tokens to avoid inconsistent auth state
    await clearAllTokensInternal();
    return null;
  }
};

/**
 * Clear all authentication tokens from secure storage
 * This should be called during logout or when auth state becomes invalid
 *
 * @throws Never throws - attempts to clear both tokens regardless of individual failures
 */
export const clearTokens = async (): Promise<void> => {
  await clearAllTokensInternal();
};

/**
 * Token storage utility object for convenient access
 */
export const tokenStorage = {
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
};

export default tokenStorage;
