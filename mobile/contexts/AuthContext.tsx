/**
 * AuthContext - Authentication context for the mobile app
 * Provides user state and authentication methods with token refresh
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  authApi,
  clearAuth,
  setUser,
  getUser,
  // Token storage now uses SecureStore for enhanced security
  setAccessToken,
  getAccessToken,
  setRefreshToken as setSecureRefreshToken,
  getRefreshToken as getSecureRefreshToken,
  clearTokens,
} from '@gnb-transfer/shared';
import type { User, LoginCredentials, RegisterCredentials } from '@gnb-transfer/shared';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const storedUser = await getUser<User>();
          if (storedUser) {
            setUserState(storedUser);
          } else {
            // Token exists but no user, try to fetch profile
            try {
              const profile = await authApi.getProfile();
              setUserState(profile);
              await setUser(profile);
            } catch {
              // Token invalid, clear auth (both secure tokens and user data)
              await clearTokens();
              await clearAuth();
            }
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    await setAccessToken(response.accessToken);
    if (response.refreshToken) {
      await setSecureRefreshToken(response.refreshToken);
    }
    await setUser(response.user);
    setUserState(response.user);
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const response = await authApi.register(credentials);
    await setAccessToken(response.accessToken);
    if (response.refreshToken) {
      await setSecureRefreshToken(response.refreshToken);
    }
    await setUser(response.user);
    setUserState(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear secure tokens and user data on logout
      await clearTokens();
      await clearAuth();
      setUserState(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await authApi.getProfile();
      setUserState(profile);
      await setUser(profile);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  /**
   * Manually refresh the access token using the refresh token
   * Returns true if refresh was successful, false otherwise
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const storedRefreshToken = await getSecureRefreshToken();
      if (!storedRefreshToken) {
        return false;
      }

      const response = await authApi.refresh(storedRefreshToken);
      await setAccessToken(response.accessToken);
      if (response.refreshToken) {
        await setSecureRefreshToken(response.refreshToken);
      }
      if (response.user) {
        setUserState(response.user);
        await setUser(response.user);
      }
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Token refresh failed, clear auth state (both secure tokens and user data)
      await clearTokens();
      await clearAuth();
      setUserState(null);
      return false;
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
