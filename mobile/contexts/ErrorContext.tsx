/**
 * ErrorContext - Global error handling for the mobile app
 * Handles network errors with Alert and 401 errors with automatic logout
 */

import React, { createContext, useContext, useCallback, ReactNode, useRef } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

interface ApiError {
  status?: number;
  message?: string;
  code?: string;
}

interface ErrorContextType {
  handleError: (error: ApiError | Error) => void;
  handleNetworkError: (error: Error) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const { logout } = useAuth();
  // Track if we're currently showing an alert to prevent duplicates
  const isShowingAlertRef = useRef(false);

  /**
   * Handle generic API errors
   * Shows appropriate alerts based on error type
   */
  const handleError = useCallback((error: ApiError | Error) => {
    // Prevent duplicate alerts
    if (isShowingAlertRef.current) return;

    const apiError = error as ApiError;
    
    // Handle 401 Unauthorized - Session expired
    if (apiError.status === 401 || apiError.code === 'SESSION_EXPIRED') {
      isShowingAlertRef.current = true;
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again.',
        [
          {
            text: 'OK',
            onPress: async () => {
              isShowingAlertRef.current = false;
              await logout();
            },
          },
        ],
        { cancelable: false }
      );
      return;
    }

    // Handle network errors
    if (apiError.code === 'NETWORK_ERROR' || !apiError.status) {
      handleNetworkError(error as Error);
      return;
    }

    // Handle other HTTP errors
    let title = 'Error';
    let message = apiError.message || 'An unexpected error occurred. Please try again.';

    switch (apiError.status) {
      case 400:
        title = 'Invalid Request';
        break;
      case 403:
        title = 'Access Denied';
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        title = 'Not Found';
        message = 'The requested resource was not found.';
        break;
      case 429:
        title = 'Too Many Requests';
        message = 'Please wait a moment and try again.';
        break;
      case 500:
      case 502:
      case 503:
        title = 'Server Error';
        message = 'Something went wrong on our end. Please try again later.';
        break;
    }

    isShowingAlertRef.current = true;
    Alert.alert(title, message, [
      { text: 'OK', onPress: () => { isShowingAlertRef.current = false; } },
    ]);
  }, [logout]);

  /**
   * Handle network-specific errors
   * Shows a user-friendly alert for connectivity issues
   */
  const handleNetworkError = useCallback((error: Error) => {
    if (isShowingAlertRef.current) return;

    isShowingAlertRef.current = true;
    Alert.alert(
      'Connection Error',
      'Unable to connect to the server. Please check your internet connection and try again.',
      [
        { text: 'OK', onPress: () => { isShowingAlertRef.current = false; } },
      ]
    );
  }, []);

  const value: ErrorContextType = {
    handleError,
    handleNetworkError,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

/**
 * Hook to access global error handling
 */
export const useErrorHandler = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext;
