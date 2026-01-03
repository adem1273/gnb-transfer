/**
 * Payment Success Screen - Deep link handler for successful PayTR payment
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi, Tour } from '@gnb-transfer/shared';

export default function PaymentSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId),
    enabled: !!bookingId,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleViewBookings = () => {
    router.replace('/(tabs)/bookings');
  };

  const handleBrowseTours = () => {
    router.replace('/(tabs)/tours');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const tour = booking?.tour as Tour | undefined;
  const tourTitle = tour?.title || 'Tour';
  const bookingReference = bookingId?.slice(-8).toUpperCase() || 'XXXXXXXX';

  return (
    <View className="flex-1 bg-white px-6 pt-8">
      {/* Success Icon */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
          <Text className="text-5xl">✅</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-800 text-center">
          Payment Successful!
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Your payment has been processed successfully
        </Text>
      </View>

      {/* Booking Reference */}
      <View className="bg-green-50 rounded-xl p-4 mb-6">
        <Text className="text-green-600 text-sm text-center">Booking Reference</Text>
        <Text className="text-green-700 text-2xl font-bold text-center mt-1">
          #{bookingReference}
        </Text>
      </View>

      {/* Booking Details */}
      {isLoading ? (
        <View className="bg-gray-50 rounded-xl p-4 mb-6 items-center justify-center py-8">
          <ActivityIndicator size="small" color="#1D4ED8" />
          <Text className="text-gray-500 mt-2">Loading booking details...</Text>
        </View>
      ) : booking ? (
        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Booking Details 📋
          </Text>
          <View className="flex-row justify-between py-2 border-b border-gray-200">
            <Text className="text-gray-500">Tour</Text>
            <Text className="text-gray-800 font-medium flex-1 text-right ml-4" numberOfLines={1}>
              {tourTitle}
            </Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-gray-200">
            <Text className="text-gray-500">Date</Text>
            <Text className="text-gray-800">{formatDate(booking.date)}</Text>
          </View>
          {booking.time && (
            <View className="flex-row justify-between py-2 border-b border-gray-200">
              <Text className="text-gray-500">Time</Text>
              <Text className="text-gray-800">{booking.time}</Text>
            </View>
          )}
          <View className="flex-row justify-between py-2 border-b border-gray-200">
            <Text className="text-gray-500">Status</Text>
            <View className="bg-green-100 px-2 py-1 rounded">
              <Text className="text-green-800 text-xs font-medium">
                Paid
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Total Paid</Text>
            <Text className="text-green-600 font-bold text-lg">
              ${booking.amount?.toFixed(0) || '—'}
            </Text>
          </View>
        </View>
      ) : (
        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <Text className="text-gray-500 text-center py-4">
            Booking details will be sent to your email
          </Text>
        </View>
      )}

      {/* Next Steps */}
      <View className="bg-blue-50 rounded-xl p-4 mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          What's Next? 🚀
        </Text>
        <View className="space-y-2">
          <View className="flex-row items-start">
            <Text className="text-primary mr-2">1.</Text>
            <Text className="text-gray-600 flex-1">
              You'll receive a confirmation email with receipt
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-primary mr-2">2.</Text>
            <Text className="text-gray-600 flex-1">
              Our team will confirm pickup details
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-primary mr-2">3.</Text>
            <Text className="text-gray-600 flex-1">
              Be ready at your pickup location on the scheduled date
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3 mt-auto pb-8">
        <TouchableOpacity
          onPress={handleViewBookings}
          className="bg-primary py-4 rounded-xl items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            View My Bookings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBrowseTours}
          className="bg-gray-100 py-4 rounded-xl items-center"
          activeOpacity={0.8}
        >
          <Text className="text-gray-800 font-semibold text-base">
            Browse More Tours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoHome}
          className="py-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-gray-500">← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
