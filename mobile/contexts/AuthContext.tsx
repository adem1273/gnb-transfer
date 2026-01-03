/**
 * AuthContext - Authentication context for the mobile app
 * Provides user state and authentication methods
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, User, LoginCredentials, RegisterCredentials, clearAuth, setToken, setRefreshToken, setUser, getUser, getToken } from '@gnb-transfer/shared';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
        const token = await getToken();
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
              // Token invalid, clear auth
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
    await setToken(response.accessToken);
    if (response.refreshToken) {
      await setRefreshToken(response.refreshToken);
    }
    await setUser(response.user);
    setUserState(response.user);
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const response = await authApi.register(credentials);
    await setToken(response.accessToken);
    if (response.refreshToken) {
      await setRefreshToken(response.refreshToken);
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

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
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
