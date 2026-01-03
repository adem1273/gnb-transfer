/**
 * Tour card component for displaying tour information
 * Optimized with React.memo and expo-image for performance
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Tour } from '@gnb-transfer/shared';

// Default blurhash for placeholder - represents a light gray gradient
const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

interface TourCardProps {
  tour: Tour;
  compact?: boolean;
}

function TourCardComponent({ tour, compact = false }: TourCardProps) {
  const router = useRouter();
  const id = tour.id || tour._id;

  const handlePress = () => {
    router.push(`/tour/${id}`);
  };

  const discountedPrice = tour.discount 
    ? tour.price * (1 - tour.discount / 100) 
    : tour.price;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className="bg-white rounded-xl overflow-hidden w-48 mr-4 shadow-sm"
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: tour.image || 'https://via.placeholder.com/200x120' }}
          className="w-full h-28"
          contentFit="cover"
          placeholder={DEFAULT_BLURHASH}
          transition={200}
          cachePolicy="memory-disk"
        />
        <View className="p-3">
          <Text className="text-gray-800 font-semibold text-sm" numberOfLines={1}>
            {tour.title}
          </Text>
          <View className="flex-row items-center mt-1">
            {tour.discount ? (
              <>
                <Text className="text-primary font-bold text-sm">
                  ${discountedPrice.toFixed(0)}
                </Text>
                <Text className="text-gray-400 text-xs ml-1 line-through">
                  ${tour.price}
                </Text>
              </>
            ) : (
              <Text className="text-primary font-bold text-sm">
                ${tour.price}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white rounded-xl overflow-hidden mb-4 shadow-sm"
      activeOpacity={0.8}
    >
      <View className="relative">
        <Image
          source={{ uri: tour.image || 'https://via.placeholder.com/400x200' }}
          className="w-full h-44"
          contentFit="cover"
          placeholder={DEFAULT_BLURHASH}
          transition={200}
          cachePolicy="memory-disk"
        />
        {tour.isCampaign && (
          <View className="absolute top-3 left-3 bg-accent px-2 py-1 rounded">
            <Text className="text-white text-xs font-bold">CAMPAIGN</Text>
          </View>
        )}
        {tour.discount && tour.discount > 0 && (
          <View className="absolute top-3 right-3 bg-red-500 px-2 py-1 rounded">
            <Text className="text-white text-xs font-bold">-{tour.discount}%</Text>
          </View>
        )}
      </View>
      <View className="p-4">
        <Text className="text-gray-800 font-bold text-lg" numberOfLines={1}>
          {tour.title}
        </Text>
        <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
          {tour.description}
        </Text>
        <View className="flex-row justify-between items-center mt-3">
          <View className="flex-row items-center">
            {tour.discount ? (
              <>
                <Text className="text-primary font-bold text-xl">
                  ${discountedPrice.toFixed(0)}
                </Text>
                <Text className="text-gray-400 text-sm ml-2 line-through">
                  ${tour.price}
                </Text>
              </>
            ) : (
              <Text className="text-primary font-bold text-xl">
                ${tour.price}
              </Text>
            )}
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-sm">⏱️ {tour.duration}h</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Memoize to prevent unnecessary re-renders in lists
// areEqual returns true when props haven't changed (skip re-render)
export const TourCard = memo(TourCardComponent, (prevProps, nextProps) => {
  // Return true if props are equal (don't re-render)
  const prevTour = prevProps.tour;
  const nextTour = nextProps.tour;
  return (
    (prevTour.id || prevTour._id) === (nextTour.id || nextTour._id) &&
    prevTour.title === nextTour.title &&
    prevTour.price === nextTour.price &&
    prevTour.discount === nextTour.discount &&
    prevTour.image === nextTour.image &&
    prevProps.compact === nextProps.compact
  );
});

export default TourCard;
