/**
 * Payment Failed Screen - Deep link handler for failed PayTR payment
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentFailedScreen() {
  const { bookingId, error } = useLocalSearchParams<{
    bookingId: string;
    error?: string;
  }>();
  const router = useRouter();

  const bookingReference = bookingId?.slice(-8).toUpperCase() || 'XXXXXXXX';

  const handleRetryPayment = () => {
    // Navigate back to the booking flow to retry payment
    router.replace('/(tabs)/bookings');
  };

  const handleContactSupport = () => {
    // In a real app, you might open an email or chat
    router.replace('/(tabs)');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-white px-6 pt-8">
      {/* Failure Icon */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-4">
          <Text className="text-5xl">❌</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-800 text-center">
          Payment Failed
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Your payment could not be processed
        </Text>
      </View>

      {/* Booking Reference */}
      <View className="bg-red-50 rounded-xl p-4 mb-6">
        <Text className="text-red-600 text-sm text-center">Booking Reference</Text>
        <Text className="text-red-700 text-2xl font-bold text-center mt-1">
          #{bookingReference}
        </Text>
      </View>

      {/* Error Message */}
      <View className="bg-gray-100 rounded-xl p-4 mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-2">
          What Happened? 🤔
        </Text>
        <Text className="text-gray-600">
          {error || 'The payment was not completed. This could be due to:'}
        </Text>
        {!error && (
          <View className="mt-3 space-y-1">
            <Text className="text-gray-500">• Insufficient funds</Text>
            <Text className="text-gray-500">• Card was declined</Text>
            <Text className="text-gray-500">• Payment was cancelled</Text>
            <Text className="text-gray-500">• Network connection issue</Text>
          </View>
        )}
      </View>

      {/* What to Do */}
      <View className="bg-blue-50 rounded-xl p-4 mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          What You Can Do 💡
        </Text>
        <View className="space-y-2">
          <View className="flex-row items-start">
            <Text className="text-primary mr-2">1.</Text>
            <Text className="text-gray-600 flex-1">
              Check your card details and try again
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-primary mr-2">2.</Text>
            <Text className="text-gray-600 flex-1">
              Try a different payment method
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-primary mr-2">3.</Text>
            <Text className="text-gray-600 flex-1">
              Contact your bank if the issue persists
            </Text>
          </View>
        </View>
      </View>

      {/* Important Note */}
      <View className="bg-yellow-50 rounded-xl p-4 mb-6">
        <Text className="text-yellow-800 font-medium">
          ⚠️ Note: Your booking has been saved but is not confirmed until payment is completed.
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3 mt-auto pb-8">
        <TouchableOpacity
          onPress={handleRetryPayment}
          className="bg-primary py-4 rounded-xl items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            View My Bookings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleContactSupport}
          className="bg-gray-100 py-4 rounded-xl items-center"
          activeOpacity={0.8}
        >
          <Text className="text-gray-800 font-semibold text-base">
            Contact Support
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

      {/* Support Info */}
      <View className="bg-gray-50 rounded-xl p-4 mb-8">
        <Text className="text-gray-600 text-center text-sm">
          Need help? Our support team is available 24/7
        </Text>
        <Text className="text-primary text-center mt-1">
          📧 support@gnbtransfer.com
        </Text>
      </View>
    </View>
  );
}
