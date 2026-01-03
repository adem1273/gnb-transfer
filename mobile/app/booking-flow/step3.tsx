/**
 * Booking Step 3 - Payment selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toursApi, bookingsApi, PaymentMethod } from '@gnb-transfer/shared';
import { Loading } from '../../components/common/Loading';
import { ErrorState } from '../../components/common/ErrorState';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentOption {
  method: PaymentMethod;
  label: string;
  icon: string;
  description: string;
}

const paymentOptions: PaymentOption[] = [
  {
    method: 'cash',
    label: 'Cash',
    icon: '💵',
    description: 'Pay with cash to driver',
  },
  {
    method: 'credit_card',
    label: 'Credit Card',
    icon: '💳',
    description: 'Pay securely with card',
  },
  {
    method: 'stripe',
    label: 'Stripe',
    icon: '🔐',
    description: 'Secure online payment',
  },
];

export default function BookingStep3() {
  const params = useLocalSearchParams<{
    tourId: string;
    date: string;
    time: string;
    adults: string;
    children: string;
    infants: string;
    name: string;
    email: string;
    phone: string;
    pickupLocation: string;
    flightNumber: string;
    notes: string;
  }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');

  const {
    data: tour,
    isLoading: isLoadingTour,
    error: tourError,
  } = useQuery({
    queryKey: ['tour', params.tourId],
    queryFn: () => toursApi.getById(params.tourId),
    enabled: !!params.tourId,
  });

  const createBookingMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: (booking) => {
      router.replace(`/booking-flow/confirmation?bookingId=${booking.id || booking._id}`);
    },
    onError: (error: any) => {
      Alert.alert(
        'Booking Failed',
        error?.message || 'Failed to create booking. Please try again.'
      );
    },
  });

  const adults = Number(params.adults) || 1;
  const children = Number(params.children) || 0;
  const infants = Number(params.infants) || 0;
  const totalGuests = adults + children + infants;

  const discountedPrice = tour?.discount
    ? tour.price * (1 - tour.discount / 100)
    : tour?.price || 0;
  const adultsTotal = adults * discountedPrice;
  const childrenTotal = children * discountedPrice * 0.5;
  const totalPrice = adultsTotal + childrenTotal;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleConfirmBooking = () => {
    if (!isAuthenticated && selectedPayment !== 'cash') {
      Alert.alert(
        'Login Required',
        'Please log in to use online payment methods.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    // Build passengers array
    const passengers = [];
    for (let i = 0; i < adults; i++) {
      passengers.push({ firstName: '', lastName: '', type: 'adult' as const });
    }
    for (let i = 0; i < children; i++) {
      passengers.push({ firstName: '', lastName: '', type: 'child' as const });
    }
    for (let i = 0; i < infants; i++) {
      passengers.push({ firstName: '', lastName: '', type: 'infant' as const });
    }

    createBookingMutation.mutate({
      tourId: params.tourId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      date: params.date,
      time: params.time,
      adultsCount: adults,
      childrenCount: children,
      infantsCount: infants,
      passengers,
      pickupLocation: params.pickupLocation,
      notes: params.notes,
      paymentMethod: selectedPayment,
    });
  };

  if (isLoadingTour) {
    return <Loading fullScreen message="Loading..." />;
  }

  if (tourError || !tour) {
    return <ErrorState message="Failed to load tour details" fullScreen />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View className="bg-white px-4 py-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Order Summary 🛒
          </Text>

          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
            <View className="w-16 h-16 bg-gray-200 rounded-lg items-center justify-center mr-3">
              <Text className="text-2xl">🗺️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold">{tour.title}</Text>
              <Text className="text-gray-500 text-sm mt-1">
                {formatDate(params.date)} at {params.time}
              </Text>
            </View>
          </View>

          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Contact</Text>
              <Text className="text-gray-800">{params.name}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Email</Text>
              <Text className="text-gray-800">{params.email}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Phone</Text>
              <Text className="text-gray-800">{params.phone}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Pickup</Text>
              <Text className="text-gray-800 text-right flex-1 ml-4" numberOfLines={1}>
                {params.pickupLocation}
              </Text>
            </View>
            {params.flightNumber && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Flight</Text>
                <Text className="text-gray-800">{params.flightNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Price Breakdown */}
        <View className="bg-white px-4 py-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Price Breakdown 💰
          </Text>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-600">
              Adults ({adults} × ${discountedPrice.toFixed(0)})
            </Text>
            <Text className="text-gray-800">${adultsTotal.toFixed(0)}</Text>
          </View>
          {children > 0 && (
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">
                Children ({children} × ${(discountedPrice * 0.5).toFixed(0)})
              </Text>
              <Text className="text-gray-800">${childrenTotal.toFixed(0)}</Text>
            </View>
          )}
          {infants > 0 && (
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Infants ({infants})</Text>
              <Text className="text-green-600">Free</Text>
            </View>
          )}
          <View className="flex-row justify-between py-3 mt-2 border-t border-gray-200">
            <Text className="text-gray-800 font-semibold text-lg">Total</Text>
            <Text className="text-primary font-bold text-xl">
              ${totalPrice.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View className="bg-white px-4 py-4 mb-24">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Payment Method 💳
          </Text>
          {paymentOptions.map((option) => (
            <TouchableOpacity
              key={option.method}
              onPress={() => setSelectedPayment(option.method)}
              className={`flex-row items-center p-4 rounded-xl mb-3 border-2 ${
                selectedPayment === option.method
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-gray-50'
              }`}
              activeOpacity={0.7}
            >
              <Text className="text-2xl mr-3">{option.icon}</Text>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">{option.label}</Text>
                <Text className="text-gray-500 text-sm">{option.description}</Text>
              </View>
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  selectedPayment === option.method
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}
              >
                {selectedPayment === option.method && (
                  <Text className="text-white text-xs">✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <View className="flex-row items-center">
          <View className="flex-1 mr-4">
            <Text className="text-gray-500 text-sm">Total</Text>
            <Text className="text-2xl font-bold text-primary">
              ${totalPrice.toFixed(0)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleConfirmBooking}
            disabled={createBookingMutation.isPending}
            className={`bg-primary px-8 py-4 rounded-xl ${
              createBookingMutation.isPending ? 'opacity-70' : ''
            }`}
            activeOpacity={0.8}
          >
            {createBookingMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-base">Confirm Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
