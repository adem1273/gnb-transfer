/**
 * TourDetail Screen - Display tour details with image, description, reviews, and Book Now button
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { toursApi, Review } from '@gnb-transfer/shared';
import { ErrorState } from '../../components/common/ErrorState';
import { TourDetailSkeleton } from '../../components/skeleton/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock reviews (would normally come from API)
const mockReviews: Review[] = [
  {
    id: '1',
    name: 'John D.',
    rating: 5,
    comment: 'Amazing experience! The tour guide was very knowledgeable and friendly.',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Sarah M.',
    rating: 4,
    comment: 'Great tour overall. Would definitely recommend to others.',
    createdAt: '2024-01-10T14:30:00Z',
  },
  {
    id: '3',
    name: 'Ahmed K.',
    rating: 5,
    comment: 'Perfect organization and beautiful destinations!',
    createdAt: '2024-01-05T09:15:00Z',
  },
];

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data: tour,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tour', id],
    queryFn: () => toursApi.getById(id),
    enabled: !!id,
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing tour: ${tour?.title}\n\nPrice: $${tour?.price}`,
        title: tour?.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBookNow = () => {
    router.push(`/booking-flow/step1?tourId=${id}`);
  };

  // Use tour image or placeholder - single image display
  const tourImage = tour?.image || 'https://via.placeholder.com/400x300';

  const discountedPrice = tour?.discount
    ? tour.price * (1 - tour.discount / 100)
    : tour?.price;

  if (isLoading) {
    return <TourDetailSkeleton />;
  }

  if (error || !tour) {
    return (
      <ErrorState
        message="Failed to load tour details"
        onRetry={refetch}
        fullScreen
      />
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: tour.title,
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} className="p-2">
              <Text className="text-white text-lg">📤</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Tour Image */}
        <View className="relative">
          <Image
            source={{ uri: tourImage }}
            style={{ width: SCREEN_WIDTH, height: 280 }}
            resizeMode="cover"
          />

          {/* Discount Badge */}
          {tour.discount && tour.discount > 0 && (
            <View className="absolute top-4 right-4 bg-red-500 px-3 py-1 rounded-full">
              <Text className="text-white font-bold text-sm">-{tour.discount}%</Text>
            </View>
          )}

          {/* Campaign Badge */}
          {tour.isCampaign && (
            <View className="absolute top-4 left-4 bg-accent px-3 py-1 rounded-full">
              <Text className="text-white font-bold text-sm">🔥 CAMPAIGN</Text>
            </View>
          )}
        </View>

        {/* Tour Info */}
        <View className="px-4 pt-4">
          {/* Title and Category */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-2xl font-bold text-gray-800">{tour.title}</Text>
              <View className="flex-row items-center mt-2">
                <View className="bg-primary/10 px-2 py-1 rounded">
                  <Text className="text-primary text-xs font-medium uppercase">
                    {tour.category}
                  </Text>
                </View>
                <Text className="text-gray-500 ml-3">⏱️ {tour.duration} hours</Text>
              </View>
            </View>
          </View>

          {/* Price */}
          <View className="flex-row items-baseline mt-4">
            <Text className="text-3xl font-bold text-primary">
              ${discountedPrice?.toFixed(0)}
            </Text>
            {tour.discount && tour.discount > 0 && (
              <Text className="text-gray-400 text-lg ml-2 line-through">
                ${tour.price}
              </Text>
            )}
            <Text className="text-gray-500 ml-1">/ person</Text>
          </View>

          {/* Description */}
          <View className="mt-6">
            <Text className="text-lg font-bold text-gray-800 mb-2">Description</Text>
            <Text className="text-gray-600 leading-6">{tour.description}</Text>
          </View>

          {/* Highlights */}
          <View className="mt-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">Highlights</Text>
            <View className="space-y-2">
              {['Professional guide', 'Hotel pickup & drop-off', 'All entrance fees included', 'Lunch included'].map((highlight, index) => (
                <View key={index} className="flex-row items-center">
                  <Text className="text-green-500 mr-2">✓</Text>
                  <Text className="text-gray-600">{highlight}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews Section */}
          <View className="mt-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-800">Reviews</Text>
              <View className="flex-row items-center">
                <Text className="text-yellow-500 mr-1">⭐</Text>
                <Text className="text-gray-800 font-semibold">4.8</Text>
                <Text className="text-gray-500 ml-1">({mockReviews.length})</Text>
              </View>
            </View>

            {mockReviews.map((review) => (
              <View
                key={review.id}
                className="bg-gray-50 rounded-xl p-4 mb-3"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-semibold text-gray-800">{review.name}</Text>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text
                        key={star}
                        className={star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
                <Text className="text-gray-600 text-sm">{review.comment}</Text>
              </View>
            ))}
          </View>

          {/* Spacer for bottom button */}
          <View className="h-24" />
        </View>
      </ScrollView>

      {/* Book Now Button (Fixed at bottom) */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <View className="flex-row items-center">
          <View className="flex-1 mr-4">
            <Text className="text-gray-500 text-sm">Total Price</Text>
            <Text className="text-2xl font-bold text-primary">
              ${discountedPrice?.toFixed(0)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleBookNow}
            className="bg-primary px-8 py-4 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
