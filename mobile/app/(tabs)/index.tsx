/**
 * HomeScreen - Main home screen with hero, search bar, and popular tours carousel
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toursApi, Tour } from '@gnb-transfer/shared';
import { TourCard } from '../../components/common/TourCard';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton, TourCardSkeleton } from '../../components/skeleton/Skeleton';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch popular tours
  const {
    data: popularTours,
    isLoading: isLoadingPopular,
    error: popularError,
    refetch: refetchPopular,
  } = useQuery({
    queryKey: ['tours', 'popular'],
    queryFn: toursApi.getMostPopular,
  });

  // Fetch campaign tours
  const {
    data: campaignTours,
    isLoading: isLoadingCampaigns,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ['tours', 'campaigns'],
    queryFn: toursApi.getCampaigns,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchPopular(), refetchCampaigns()]);
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/tours?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/tours');
    }
  };

  const renderPopularTour = ({ item }: { item: Tour }) => (
    <TourCard tour={item} compact />
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1D4ED8']}
        />
      }
    >
      {/* Hero Section */}
      <View className="bg-primary px-4 pt-4 pb-8">
        <Text className="text-white text-2xl font-bold mb-1">
          Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
        </Text>
        <Text className="text-blue-100 text-base mb-4">
          Where would you like to go today?
        </Text>

        {/* Search Bar */}
        <View className="flex-row bg-white rounded-xl overflow-hidden shadow-md">
          <TextInput
            className="flex-1 px-4 py-3 text-gray-800"
            placeholder="Search tours, destinations..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={handleSearch}
            className="bg-accent px-4 items-center justify-center"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex-row px-4 py-4 -mt-4">
        <TouchableOpacity
          onPress={() => router.push('/tours')}
          className="flex-1 bg-white rounded-xl p-4 mr-2 shadow-sm items-center"
          activeOpacity={0.8}
        >
          <Text className="text-2xl mb-1">🗺️</Text>
          <Text className="text-gray-700 font-medium text-sm">All Tours</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/bookings')}
          className="flex-1 bg-white rounded-xl p-4 ml-2 shadow-sm items-center"
          activeOpacity={0.8}
        >
          <Text className="text-2xl mb-1">📋</Text>
          <Text className="text-gray-700 font-medium text-sm">My Bookings</Text>
        </TouchableOpacity>
      </View>

      {/* Popular Tours Section */}
      <View className="px-4 pt-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-800 text-lg font-bold">Popular Tours</Text>
          <TouchableOpacity onPress={() => router.push('/tours')}>
            <Text className="text-primary text-sm">See All →</Text>
          </TouchableOpacity>
        </View>

        {isLoadingPopular ? (
          <View className="flex-row">
            {[1, 2, 3].map((i) => (
              <View key={i} className="w-48 mr-4">
                <Skeleton height={112} className="rounded-t-xl" />
                <View className="bg-white rounded-b-xl p-3">
                  <Skeleton width="80%" height={14} className="mb-2" />
                  <Skeleton width={60} height={14} />
                </View>
              </View>
            ))}
          </View>
        ) : popularError ? (
          <ErrorState message="Failed to load popular tours" onRetry={refetchPopular} />
        ) : popularTours && popularTours.length > 0 ? (
          <FlatList
            data={popularTours}
            renderItem={renderPopularTour}
            keyExtractor={(item) => item.id || item._id || ''}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          />
        ) : (
          <Text className="text-gray-500 text-center py-4">No popular tours available</Text>
        )}
      </View>

      {/* Campaign Tours Section */}
      <View className="px-4 pt-6 pb-8">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-800 text-lg font-bold">🔥 Special Offers</Text>
          <TouchableOpacity onPress={() => router.push('/tours')}>
            <Text className="text-primary text-sm">See All →</Text>
          </TouchableOpacity>
        </View>

        {isLoadingCampaigns ? (
          <View>
            {[1, 2].map((i) => (
              <TourCardSkeleton key={i} />
            ))}
          </View>
        ) : campaignsError ? (
          <ErrorState message="Failed to load special offers" onRetry={refetchCampaigns} />
        ) : campaignTours && campaignTours.length > 0 ? (
          campaignTours.slice(0, 3).map((tour) => (
            <TourCard key={tour.id || tour._id} tour={tour} />
          ))
        ) : (
          <View className="bg-white rounded-xl p-6 items-center">
            <Text className="text-4xl mb-2">🎁</Text>
            <Text className="text-gray-500 text-center">
              No special offers at the moment.{'\n'}Check back soon!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
