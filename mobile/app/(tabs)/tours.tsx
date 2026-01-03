/**
 * ToursList - Tours listing screen with search, filter, and pull-to-refresh
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { toursApi, Tour, TOUR_CATEGORIES, TourCategory } from '@gnb-transfer/shared';
import { TourCard } from '../../components/common/TourCard';
import { ErrorState, EmptyState } from '../../components/common/ErrorState';
import { TourCardSkeleton } from '../../components/skeleton/Skeleton';

const categoryLabels: Record<string, string> = {
  all: 'All Tours',
  transfer: 'Transfers',
  tour: 'Day Tours',
  vip: 'VIP Services',
  airport: 'Airport',
  city: 'City Tours',
  excursion: 'Excursions',
  package: 'Packages',
};

export default function ToursScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all tours
  const {
    data: tours,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tours', 'all'],
    queryFn: toursApi.getAll,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter tours based on search and category
  const filteredTours = useMemo(() => {
    if (!tours) return [];

    return tours.filter((tour) => {
      const matchesSearch =
        !searchQuery ||
        tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || tour.category === selectedCategory;

      return matchesSearch && matchesCategory && tour.active;
    });
  }, [tours, searchQuery, selectedCategory]);

  const categories = ['all', ...Object.values(TOUR_CATEGORIES)];

  const renderTourItem = ({ item }: { item: Tour }) => <TourCard tour={item} />;

  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2">
      {/* Search Bar */}
      <View className="flex-row bg-white rounded-xl overflow-hidden shadow-sm mb-4">
        <View className="flex-1 flex-row items-center px-3">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-gray-800"
            placeholder="Search tours..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setShowFilterSheet(true)}
          className="bg-gray-100 px-4 items-center justify-center"
          activeOpacity={0.8}
        >
          <Text className="text-gray-600">⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedCategory(item)}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedCategory === item ? 'bg-primary' : 'bg-white'
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-medium ${
                selectedCategory === item ? 'text-white' : 'text-gray-600'
              }`}
            >
              {categoryLabels[item] || item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 8 }}
      />

      {/* Results count */}
      <Text className="text-gray-500 text-sm mt-2">
        {filteredTours.length} tour{filteredTours.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="px-4">
          {[1, 2, 3, 4].map((i) => (
            <TourCardSkeleton key={i} />
          ))}
        </View>
      );
    }

    if (error) {
      return <ErrorState message="Failed to load tours" onRetry={refetch} />;
    }

    return (
      <EmptyState
        title="No tours found"
        message={
          searchQuery
            ? `No tours match "${searchQuery}"`
            : 'No tours available in this category'
        }
        icon="🔍"
        actionLabel="Clear Filters"
        onAction={() => {
          setSearchQuery('');
          setSelectedCategory('all');
        }}
      />
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={filteredTours}
        renderItem={renderTourItem}
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

      {/* Filter Sheet Modal */}
      <Modal
        visible={showFilterSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterSheet(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowFilterSheet(false)}
        >
          <Pressable className="bg-white rounded-t-3xl p-6">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            <Text className="text-xl font-bold text-gray-800 mb-4">Filter Tours</Text>

            <Text className="text-gray-600 font-medium mb-3">Category</Text>
            <View className="flex-row flex-wrap mb-6">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                    selectedCategory === cat ? 'bg-primary' : 'bg-gray-100'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-sm ${
                      selectedCategory === cat ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {categoryLabels[cat] || cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowFilterSheet(false)}
              className="bg-primary py-4 rounded-xl items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">Apply Filters</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
