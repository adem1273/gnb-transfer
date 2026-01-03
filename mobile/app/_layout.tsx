/**
 * Root layout for the Expo Router application
 * Provides authentication protection, global error handling, and offline support
 */

import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, onlineManager, focusManager } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, Platform, AppStateStatus } from 'react-native';
import { AuthProvider, useAuth, ErrorProvider } from '../contexts';

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

export default function RootLayout() {
  return (
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
  );
}
