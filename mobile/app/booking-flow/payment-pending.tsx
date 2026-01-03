/**
 * Payment Pending Screen - Shows while waiting for PayTR payment callback
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, AppState } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { paytrApi } from '@gnb-transfer/shared';

export default function PaymentPendingScreen() {
  const { bookingId, merchantOid } = useLocalSearchParams<{
    bookingId: string;
    merchantOid: string;
  }>();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Complete payment in browser');
  const [pollCount, setPollCount] = useState(0);

  /**
   * Check payment status from the backend
   */
  const checkPaymentStatus = useCallback(async () => {
    if (!bookingId || isChecking) return;

    try {
      setIsChecking(true);
      const status = await paytrApi.getStatus(bookingId);

      if (status.paymentStatus === 'completed') {
        // Payment successful
        router.replace(`/booking-flow/confirmation?bookingId=${bookingId}&paymentSuccess=true`);
      } else if (status.paymentStatus === 'cancelled') {
        // Payment cancelled/failed
        router.replace(`/booking-flow/confirmation?bookingId=${bookingId}&paymentFailed=true`);
      } else {
        // Still pending
        setStatusMessage('Waiting for payment confirmation...');
        setPollCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatusMessage('Unable to verify payment. Tap to retry.');
    } finally {
      setIsChecking(false);
    }
  }, [bookingId, isChecking, router]);

  /**
   * Poll for payment status when app comes back to foreground
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came back to foreground, check payment status
        checkPaymentStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPaymentStatus]);

  /**
   * Initial status check
   */
  useEffect(() => {
    // Initial check after a short delay to allow callback to be processed
    const timer = setTimeout(() => {
      checkPaymentStatus();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Periodic polling (every 5 seconds, max 12 times = 1 minute)
   */
  useEffect(() => {
    if (pollCount >= 12) {
      setStatusMessage('Payment verification timed out. Tap to check manually.');
      return;
    }

    const timer = setTimeout(() => {
      checkPaymentStatus();
    }, 5000);

    return () => clearTimeout(timer);
  }, [pollCount, checkPaymentStatus]);

  const handleManualCheck = () => {
    setPollCount(0);
    checkPaymentStatus();
  };

  const handleCancel = () => {
    router.replace('/(tabs)/bookings');
  };

  return (
    <View className="flex-1 bg-white px-6 pt-8">
      {/* Status Icon */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
          {isChecking ? (
            <ActivityIndicator size="large" color="#1D4ED8" />
          ) : (
            <Text className="text-5xl">⏳</Text>
          )}
        </View>
        <Text className="text-2xl font-bold text-gray-800 text-center">
          Processing Payment
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          {statusMessage}
        </Text>
      </View>

      {/* Order Reference */}
      {merchantOid && (
        <View className="bg-gray-100 rounded-xl p-4 mb-6">
          <Text className="text-gray-500 text-sm text-center">Order Reference</Text>
          <Text className="text-gray-800 font-mono text-center mt-1">
            {merchantOid}
          </Text>
        </View>
      )}

      {/* Instructions */}
      <View className="bg-blue-50 rounded-xl p-4 mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          Payment Instructions 📝
        </Text>
        <View className="space-y-2">
          <View className="flex-row items-start">
            <Text className="text-primary mr-2">1.</Text>
            <Text className="text-gray-600 flex-1">
              Complete the payment in your browser
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-primary mr-2">2.</Text>
            <Text className="text-gray-600 flex-1">
              Return to this app after payment
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-primary mr-2">3.</Text>
            <Text className="text-gray-600 flex-1">
              Your payment will be verified automatically
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3">
        <TouchableOpacity
          onPress={handleManualCheck}
          disabled={isChecking}
          className={`bg-primary py-4 rounded-xl items-center ${
            isChecking ? 'opacity-70' : ''
          }`}
          activeOpacity={0.8}
        >
          {isChecking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Check Payment Status
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCancel}
          className="bg-gray-100 py-4 rounded-xl items-center"
          activeOpacity={0.8}
        >
          <Text className="text-gray-700 font-semibold text-base">
            Return to Bookings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contact Support */}
      <View className="mt-auto pb-8">
        <View className="bg-gray-50 rounded-xl p-4">
          <Text className="text-gray-600 text-center text-sm">
            Having issues? Contact our support team
          </Text>
          <Text className="text-primary text-center mt-1">
            📧 support@gnbtransfer.com
          </Text>
        </View>
      </View>
    </View>
  );
}
