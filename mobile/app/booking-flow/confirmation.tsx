/**
 * Booking Confirmation Screen - Success page after booking
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi, Booking, Tour } from '@gnb-transfer/shared';
import { Loading } from '../../components/common/Loading';
import { ErrorState } from '../../components/common/ErrorState';

export default function BookingConfirmation() {
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

  if (isLoading) {
    return <Loading fullScreen message="Loading booking details..." />;
  }

  // Show success even if we can't load the booking details
  const tour = booking?.tour as Tour | undefined;
  const tourTitle = tour?.title || 'Tour';
  const bookingReference = bookingId?.slice(-8).toUpperCase() || 'XXXXXXXX';

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-8">
        {/* Success Icon */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
            <Text className="text-5xl">✅</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-800 text-center">
            Booking Confirmed!
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Your booking has been successfully placed
          </Text>
        </View>

        {/* Booking Reference */}
        <View className="bg-primary/10 rounded-xl p-4 mb-6">
          <Text className="text-primary text-sm text-center">Booking Reference</Text>
          <Text className="text-primary text-2xl font-bold text-center mt-1">
            #{bookingReference}
          </Text>
        </View>

        {/* Booking Details Card */}
        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Booking Details 📋
          </Text>

          {booking ? (
            <>
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
                <Text className="text-gray-500">Guests</Text>
                <Text className="text-gray-800">{booking.guests} person(s)</Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-500">Contact</Text>
                <Text className="text-gray-800">{booking.name}</Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-500">Status</Text>
                <View className="bg-yellow-100 px-2 py-1 rounded">
                  <Text className="text-yellow-800 text-xs font-medium capitalize">
                    {booking.status}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-500">Total Amount</Text>
                <Text className="text-primary font-bold text-lg">
                  ${booking.amount?.toFixed(0) || '—'}
                </Text>
              </View>
            </>
          ) : (
            <Text className="text-gray-500 text-center py-4">
              Booking details will be sent to your email
            </Text>
          )}
        </View>

        {/* Next Steps */}
        <View className="bg-blue-50 rounded-xl p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            What's Next? 🚀
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-start">
              <Text className="text-primary mr-2">1.</Text>
              <Text className="text-gray-600 flex-1">
                You'll receive a confirmation email shortly
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-primary mr-2">2.</Text>
              <Text className="text-gray-600 flex-1">
                Our team will contact you to confirm the details
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

        {/* Contact Support */}
        <View className="bg-gray-100 rounded-xl p-4 mb-6">
          <Text className="text-gray-800 font-medium text-center">
            Need help? Contact us
          </Text>
          <Text className="text-primary text-center mt-1">
            📧 support@gnbtransfer.com
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3 pb-8">
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
    </ScrollView>
  );
}
