/**
 * Root layout for the Expo Router application
 * Provides authentication protection, global error handling, and offline support
 * 
 * OTA UPDATE SAFETY RULES:
 * ========================
 * OTA updates are ONLY for non-breaking JavaScript changes (bug fixes, text updates, minor UI tweaks).
 * Breaking changes (navigation, auth flows, data models, native code) require a full store release.
 * 
 * Why this matters:
 * - App Store and Play Store policies require significant changes to go through review
 * - OTA bypasses store review, so it must only be used for safe, minor updates
 * - runtimeVersion 'appVersion' policy ensures only compatible updates are delivered
 * - Development builds use local Metro bundler, never OTA updates
 */

import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, onlineManager, focusManager } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, Platform, AppStateStatus, StyleSheet } from 'react-native';
import { AuthProvider, useAuth, ErrorProvider } from '../contexts';
import { initSentry, SentryErrorBoundary } from '../sentry';

/**
 * Checks if the app is running in development mode.
 * 
 * In development mode:
 * - OTA updates are disabled (development builds use local Metro bundler)
 * - The app loads JavaScript from the local development server
 * - This prevents accidental OTA fetches that could interfere with local development
 * 
 * In production mode:
 * - OTA updates are enabled via app.json configuration
 * - Updates check automatically on app load (ON_LOAD)
 * - 30-second fallback timeout ensures the app doesn't hang waiting for updates
 * 
 * __DEV__ is set by React Native and is true when running in development mode
 * (e.g., via `expo start` or `npm start`). This is the most reliable way to
 * detect development mode in React Native applications.
 */
const isDevelopment = __DEV__;

// Initialize Sentry crash reporting (production only, FREE tier)
initSentry();

// Create async storage persister for offline support
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'gnb-transfer-cache',
});

// Create QueryClient with offline support configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep data in cache longer for offline
      networkMode: 'offlineFirst', // Use cached data first
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// Persist query cache to AsyncStorage
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  buster: '1', // Change this to invalidate all caches
});

/**
 * Hook to manage online state with NetInfo
 */
function useOnlineManager() {
  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(
        state.isConnected !== null && state.isConnected && Boolean(state.isInternetReachable)
      );
    });

    return () => unsubscribe();
  }, []);
}

/**
 * Hook to refetch on app focus
 */
function useAppStateRefetch() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
    });

    return () => subscription.remove();
  }, []);
}

/**
 * Auth protection component that redirects based on auth state
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Manage online state
  useOnlineManager();
  // Refetch on app focus
  useAppStateRefetch();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inPublicRoutes = segments[0] === 'tour';

    // Allow public routes without auth
    if (inPublicRoutes) return;

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Fallback component for Sentry ErrorBoundary.
 * Shows a minimal error message without exposing any user data.
 * Allows navigation recovery by not blocking the entire app.
 */
function SentryFallback({ resetError }: { error?: Error; resetError?: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>
        The app encountered an unexpected error. Please try again.
      </Text>
      {resetError && (
        <TouchableOpacity style={styles.errorButton} onPress={resetError}>
          <Text style={styles.errorButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Styles for error fallback (avoiding NativeWind for error boundary stability)
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default function RootLayout() {
  /**
   * Development mode safety for OTA updates:
   * - __DEV__ is true when running via Metro bundler (expo start)
   * - Development builds automatically use local Metro server, not OTA
   * - OTA updates are only checked in production builds (built via EAS)
   * - This ensures developers always see their local code changes
   */
  useEffect(() => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log('[OTA] Development mode detected - OTA updates disabled, using local Metro bundler');
    }
  }, []);

  return (
    <SentryErrorBoundary fallback={SentryFallback}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <ErrorProvider>
              <AuthGuard>
                <StatusBar style="auto" />
                <Slot />
              </AuthGuard>
            </ErrorProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </SentryErrorBoundary>
  );
}
