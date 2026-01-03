/**
 * BookingsScreen - User's bookings list
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { bookingsApi, Booking } from '@gnb-transfer/shared';
import { BookingCard } from '../../components/common/BookingCard';
import { ErrorState, EmptyState } from '../../components/common/ErrorState';
import { BookingCardSkeleton } from '../../components/skeleton/Skeleton';
import { useAuth } from '../../contexts/AuthContext';

const statusFilters = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function BookingsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bookings', 'user'],
    queryFn: () => bookingsApi.getUserBookings(),
    enabled: isAuthenticated,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const bookings = data?.bookings || [];

  const filteredBookings = selectedStatus === 'all'
    ? bookings
    : bookings.filter((b) => b.status === selectedStatus);

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <BookingCard booking={item} />
  );

  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2">
      {/* Status Filter Pills */}
      <FlatList
        data={statusFilters}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedStatus(item)}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedStatus === item ? 'bg-primary' : 'bg-white'
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-medium capitalize ${
                selectedStatus === item ? 'text-white' : 'text-gray-600'
              }`}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
      <Text className="text-gray-500 text-sm mt-2">
        {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="px-4">
          {[1, 2, 3].map((i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </View>
      );
    }

    if (error) {
      return <ErrorState message="Failed to load bookings" onRetry={refetch} />;
    }

    if (!isAuthenticated) {
      return (
        <EmptyState
          title="Sign in required"
          message="Please sign in to view your bookings"
          icon="🔒"
          actionLabel="Sign In"
          onAction={() => router.push('/(auth)/login')}
        />
      );
    }

    return (
      <EmptyState
        title="No bookings yet"
        message="You haven't made any bookings yet. Browse our tours and book your next adventure!"
        icon="📋"
        actionLabel="Browse Tours"
        onAction={() => router.push('/(tabs)/tours')}
      />
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id || item._id || ''}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1D4ED8']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
