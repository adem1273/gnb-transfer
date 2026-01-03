/**
 * API endpoint functions for interacting with the GNB Transfer backend
 * Provides typed functions for tours, bookings, and authentication
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants';
import type {
  Tour,
  Booking,
  User,
  AuthResponse,
  TokenRefreshResponse,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
  PaginatedResponse,
  PaginationInfo,
  BookingFormData,
} from '../types';

// ==================== Tours API ====================

/**
 * Tours API - Functions for tour-related operations
 */
export const toursApi = {
  /**
   * Get all active tours
   * @returns Promise with array of tours
   */
  getAll: async (): Promise<Tour[]> => {
    const response = await apiClient.get<ApiResponse<Tour[]>>(API_ENDPOINTS.TOURS.BASE);
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch tours');
  },

  /**
   * Get a tour by ID
   * @param id - Tour ID
   * @returns Promise with tour data
   */
  getById: async (id: string): Promise<Tour> => {
    const response = await apiClient.get<ApiResponse<Tour>>(`${API_ENDPOINTS.TOURS.BASE}/${id}`);
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Tour not found');
  },

  /**
   * Get campaign tours (tours with discounts)
   * @returns Promise with array of campaign tours
   */
  getCampaigns: async (): Promise<Tour[]> => {
    const response = await apiClient.get<ApiResponse<Tour[]>>(API_ENDPOINTS.TOURS.CAMPAIGNS);
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch campaign tours');
  },

  /**
   * Get most popular tours
   * @returns Promise with array of popular tours
   */
  getMostPopular: async (): Promise<Tour[]> => {
    const response = await apiClient.get<ApiResponse<Tour[]>>(API_ENDPOINTS.TOURS.MOST_POPULAR);
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch popular tours');
  },

  /**
   * Get discounted price for a tour
   * @param id - Tour ID
   * @returns Promise with price information
   */
  getDiscountedPrice: async (
    id: string
  ): Promise<{ originalPrice: number; discount: number; discountedPrice: number }> => {
    const response = await apiClient.get<
      ApiResponse<{ originalPrice: number; discount: number; discountedPrice: number }>
    >(`${API_ENDPOINTS.TOURS.BASE}/${id}/discounted-price`);
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to get discounted price');
  },
};

// ==================== Bookings API ====================

/**
 * Bookings API - Functions for booking-related operations
 */
export const bookingsApi = {
  /**
   * Create a new booking
   * @param bookingData - Booking form data
   * @returns Promise with created booking
   */
  create: async (bookingData: BookingFormData): Promise<Booking> => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      API_ENDPOINTS.BOOKINGS.BASE,
      bookingData
    );
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to create booking');
  },

  /**
   * Get all bookings (admin only)
   * @param params - Pagination and filter parameters
   * @returns Promise with paginated bookings
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ bookings: Booking[]; pagination: PaginationInfo }> => {
    const response = await apiClient.get<
      ApiResponse<{ bookings: Booking[]; pagination: PaginationInfo }>
    >(API_ENDPOINTS.BOOKINGS.BASE, { params });
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch bookings');
  },

  /**
   * Get a booking by ID (admin only)
   * @param id - Booking ID
   * @returns Promise with booking data
   */
  getById: async (id: string): Promise<Booking> => {
    const response = await apiClient.get<ApiResponse<Booking>>(
      `${API_ENDPOINTS.BOOKINGS.BASE}/${id}`
    );
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Booking not found');
  },

  /**
   * Get current user's bookings
   * @param params - Pagination and filter parameters
   * @returns Promise with user's bookings
   */
  getUserBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ bookings: Booking[]; pagination: PaginationInfo }> => {
    const response = await apiClient.get<
      ApiResponse<{ bookings: Booking[]; pagination: PaginationInfo }>
    >(API_ENDPOINTS.USERS.BOOKINGS, { params });
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch user bookings');
  },

  /**
   * Update booking status (admin only)
   * @param id - Booking ID
   * @param status - New status
   * @returns Promise with updated booking
   */
  updateStatus: async (
    id: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'paid'
  ): Promise<Booking> => {
    const response = await apiClient.put<ApiResponse<Booking>>(
      `${API_ENDPOINTS.BOOKINGS.BASE}/${id}/status`,
      { status }
    );
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to update booking status');
  },

  /**
   * Delete a booking (admin only)
   * @param id - Booking ID
   * @returns Promise that resolves when deleted
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `${API_ENDPOINTS.BOOKINGS.BASE}/${id}`
    );
    if (!response.data.success) {
      throw new Error('Failed to delete booking');
    }
  },

  /**
   * Get calendar events (admin/manager only)
   * @param params - Date range parameters
   * @returns Promise with calendar events
   */
  getCalendarEvents: async (params?: { startDate?: string; endDate?: string }): Promise<
    Array<{
      id: string;
      title: string;
      start: string;
      end: string;
      status: string;
      color: string;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: string;
          title: string;
          start: string;
          end: string;
          status: string;
          color: string;
        }>
      >
    >(API_ENDPOINTS.BOOKINGS.CALENDAR, { params });
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch calendar events');
  },
};

// ==================== Auth API ====================

/**
 * Auth API - Functions for authentication operations
 */
export const authApi = {
  /**
   * Login with email and password
   * @param credentials - Login credentials
   * @returns Promise with auth response (tokens and user)
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Login failed');
  },

  /**
   * Register a new user
   * @param credentials - Registration credentials
   * @returns Promise with auth response (tokens and user)
   */
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.REGISTER,
      credentials
    );
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Registration failed');
  },

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Current refresh token
   * @returns Promise with new tokens
   */
  refresh: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    const response = await apiClient.post<ApiResponse<TokenRefreshResponse>>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Token refresh failed');
  },

  /**
   * Logout user (revoke refresh token)
   * @param refreshToken - Refresh token to revoke
   * @returns Promise that resolves when logged out
   */
  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
  },

  /**
   * Get current user's profile
   * @returns Promise with user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.PROFILE);
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch profile');
  },

  /**
   * Request password reset email
   * @param email - User's email address
   * @returns Promise that resolves when email is sent
   */
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  /**
   * Reset password using token
   * @param token - Reset token from email
   * @param password - New password
   * @returns Promise that resolves when password is reset
   */
  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.AUTH.RESET_PASSWORD}/${token}`, { password });
  },

  /**
   * Authenticate with Google
   * @param credential - Google ID token
   * @returns Promise with auth response
   */
  googleAuth: async (credential: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.GOOGLE_AUTH,
      { credential }
    );
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Google authentication failed');
  },

  /**
   * Authenticate with Apple
   * @param identityToken - Apple identity token
   * @param user - User info from Apple (first sign in only)
   * @returns Promise with auth response
   */
  appleAuth: async (
    identityToken: string,
    user?: { name?: { firstName?: string; lastName?: string } }
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.APPLE_AUTH,
      { identityToken, user }
    );
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Apple authentication failed');
  },

  /**
   * Get user's permissions based on role
   * @returns Promise with permissions
   */
  getPermissions: async (): Promise<{ role: string; permissions: string[] }> => {
    const response = await apiClient.get<
      ApiResponse<{ role: string; permissions: string[] }>
    >(API_ENDPOINTS.USERS.PERMISSIONS);
    if (response.data.success && 'data' in response.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch permissions');
  },
};

// Export all APIs
export const api = {
  tours: toursApi,
  bookings: bookingsApi,
  auth: authApi,
};

export default api;
