/**
 * Storage wrapper for secure token storage
 * Works with React Native AsyncStorage for mobile apps
 * Falls back to a simple in-memory storage for non-React-Native environments
 */

import { STORAGE_KEYS } from '../constants';

// Storage interface for platform-agnostic storage operations
interface StorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
  clear(): Promise<void>;
}

// In-memory storage fallback for non-React-Native environments
class InMemoryStorage implements StorageInterface {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach((key) => this.storage.delete(key));
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

// Try to import AsyncStorage, fall back to in-memory storage
let storageImpl: StorageInterface;
try {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storageImpl = AsyncStorage;
} catch {
  // AsyncStorage not available - use in-memory storage fallback
  storageImpl = new InMemoryStorage();
}

/**
 * Set the access token in storage
 * @param token - JWT access token
 */
export const setToken = async (token: string): Promise<void> => {
  try {
    await storageImpl.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  } catch (error) {
    console.error('Error setting token:', error);
    throw error;
  }
};

/**
 * Get the access token from storage
 * @returns JWT access token or null if not found
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await storageImpl.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Set the refresh token in storage
 * @param refreshToken - JWT refresh token
 */
export const setRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    await storageImpl.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  } catch (error) {
    console.error('Error setting refresh token:', error);
    throw error;
  }
};

/**
 * Get the refresh token from storage
 * @returns JWT refresh token or null if not found
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await storageImpl.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Clear all authentication tokens from storage
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await storageImpl.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  } catch (error) {
    console.error('Error clearing tokens:', error);
    throw error;
  }
};

/**
 * Store user data in storage
 * @param user - User object to store
 */
export const setUser = async (user: object): Promise<void> => {
  try {
    await storageImpl.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error setting user:', error);
    throw error;
  }
};

/**
 * Get user data from storage
 * @returns User object or null if not found
 */
export const getUser = async <T = object>(): Promise<T | null> => {
  try {
    const userData = await storageImpl.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Clear user data from storage
 */
export const clearUser = async (): Promise<void> => {
  try {
    await storageImpl.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error clearing user:', error);
    throw error;
  }
};

/**
 * Clear all auth-related data (tokens and user)
 */
export const clearAuth = async (): Promise<void> => {
  try {
    await storageImpl.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

/**
 * Get preferred language from storage
 * @returns Language code or null if not set
 */
export const getLanguage = async (): Promise<string | null> => {
  try {
    return await storageImpl.getItem(STORAGE_KEYS.LANGUAGE);
  } catch (error) {
    console.error('Error getting language:', error);
    return null;
  }
};

/**
 * Set preferred language in storage
 * @param language - Language code (e.g., 'en', 'tr')
 */
export const setLanguage = async (language: string): Promise<void> => {
  try {
    await storageImpl.setItem(STORAGE_KEYS.LANGUAGE, language);
  } catch (error) {
    console.error('Error setting language:', error);
    throw error;
  }
};

/**
 * Check if onboarding is complete
 * @returns true if onboarding is complete
 */
export const isOnboardingComplete = async (): Promise<boolean> => {
  try {
    const value = await storageImpl.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as complete
 */
export const setOnboardingComplete = async (): Promise<void> => {
  try {
    await storageImpl.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  } catch (error) {
    console.error('Error setting onboarding complete:', error);
    throw error;
  }
};

/**
 * Get a generic item from storage
 * @param key - Storage key
 * @returns Stored value or null
 */
export const getItem = async (key: string): Promise<string | null> => {
  try {
    return await storageImpl.getItem(key);
  } catch (error) {
    console.error(`Error getting item ${key}:`, error);
    return null;
  }
};

/**
 * Set a generic item in storage
 * @param key - Storage key
 * @param value - Value to store
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await storageImpl.setItem(key, value);
  } catch (error) {
    console.error(`Error setting item ${key}:`, error);
    throw error;
  }
};

/**
 * Remove a generic item from storage
 * @param key - Storage key
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    await storageImpl.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key}:`, error);
    throw error;
  }
};

/**
 * Clear all storage (use with caution)
 */
export const clearAll = async (): Promise<void> => {
  try {
    await storageImpl.clear();
  } catch (error) {
    console.error('Error clearing all storage:', error);
    throw error;
  }
};

// Export all storage functions
export const storage = {
  setToken,
  getToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
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
};

export default storage;
