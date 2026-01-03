/**
 * Axios API client with JWT token handling
 * Includes request interceptor for adding token and response interceptor for token refresh
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { API_VERSION, DEFAULT_API_URL, HTTP_STATUS } from '../constants';
import { getToken, getRefreshToken, setToken, setRefreshToken, clearTokens } from '../utils/storage';
import type { TokenRefreshResponse, ApiResponse } from '../types';

// Get API URL from Expo config or use default
const getApiUrl = (): string => {
  const expoApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (expoApiUrl) {
    return `${expoApiUrl}/${API_VERSION}`;
  }
  return `${DEFAULT_API_URL}/${API_VERSION}`;
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * Process the queue of failed requests after token refresh
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request interceptor - adds JWT token to Authorization header
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token for request:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles 401 errors and token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network connection error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        originalError: error,
      });
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized - attempt token refresh
    if (status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          // No refresh token, clear auth and reject
          await clearTokens();
          processQueue(new Error('No refresh token available'), null);
          return Promise.reject({
            status: HTTP_STATUS.UNAUTHORIZED,
            message: 'Session expired. Please login again.',
            code: 'SESSION_EXPIRED',
          });
        }

        // Attempt to refresh the token
        const response = await axios.post<ApiResponse<TokenRefreshResponse>>(
          `${getApiUrl()}/users/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.data.success && 'data' in response.data) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Store new tokens
          await setToken(accessToken);
          if (newRefreshToken) {
            await setRefreshToken(newRefreshToken);
          }

          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Process queued requests
          processQueue(null, accessToken);

          // Retry original request
          return apiClient(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        // Token refresh failed - clear auth
        await clearTokens();
        processQueue(refreshError as Error, null);
        return Promise.reject({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: 'Session expired. Please login again.',
          code: 'SESSION_EXPIRED',
        });
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error statuses
    let message = (data as { error?: string; message?: string })?.error ||
      (data as { error?: string; message?: string })?.message ||
      'An error occurred';

    if (status === HTTP_STATUS.FORBIDDEN) {
      message = 'You do not have permission to perform this action.';
    } else if (status === HTTP_STATUS.NOT_FOUND) {
      message = 'The requested resource was not found.';
    } else if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      message = 'Too many requests. Please wait a moment and try again.';
    } else if (status >= HTTP_STATUS.INTERNAL_ERROR) {
      message = 'Server error. Please try again later.';
    }

    return Promise.reject({
      status,
      message,
      code: `HTTP_${status}`,
      data,
      originalError: error,
    });
  }
);

/**
 * Set the base URL for the API client
 * Useful for switching environments
 */
export const setBaseUrl = (url: string): void => {
  apiClient.defaults.baseURL = `${url}/${API_VERSION}`;
};

/**
 * Get the current base URL
 */
export const getBaseUrl = (): string | undefined => {
  return apiClient.defaults.baseURL;
};

// Export the configured axios instance
export { apiClient };
export default apiClient;
