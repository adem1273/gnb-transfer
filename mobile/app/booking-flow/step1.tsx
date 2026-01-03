/**
 * Booking Step 1 - Select date and number of passengers
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { toursApi, Tour } from '@gnb-transfer/shared';
import { Loading } from '../../components/common/Loading';
import { ErrorState } from '../../components/common/ErrorState';

export default function BookingStep1() {
  const { tourId } = useLocalSearchParams<{ tourId: string }>();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const {
    data: tour,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => toursApi.getById(tourId),
    enabled: !!tourId,
  });

  const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return {
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  const totalGuests = adults + children + infants;
  const discountedPrice = tour?.discount
    ? tour.price * (1 - tour.discount / 100)
    : tour?.price || 0;
  const totalPrice = discountedPrice * (adults + children * 0.5);

  const canContinue = selectedDate && selectedTime && totalGuests > 0;

  const handleContinue = () => {
    const params = new URLSearchParams({
      tourId,
      date: selectedDate,
      time: selectedTime,
      adults: adults.toString(),
      children: children.toString(),
      infants: infants.toString(),
    });
    router.push(`/booking-flow/step2?${params.toString()}`);
  };

  const CounterButton = ({
    value,
    onIncrease,
    onDecrease,
    min = 0,
    max = 10,
  }: {
    value: number;
    onIncrease: () => void;
    onDecrease: () => void;
    min?: number;
    max?: number;
  }) => (
    <View className="flex-row items-center">
      <TouchableOpacity
        onPress={onDecrease}
        disabled={value <= min}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          value <= min ? 'bg-gray-100' : 'bg-primary/10'
        }`}
      >
        <Text className={value <= min ? 'text-gray-400' : 'text-primary'}>−</Text>
      </TouchableOpacity>
      <Text className="w-10 text-center text-lg font-semibold text-gray-800">
        {value}
      </Text>
      <TouchableOpacity
        onPress={onIncrease}
        disabled={value >= max}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          value >= max ? 'bg-gray-100' : 'bg-primary/10'
        }`}
      >
        <Text className={value >= max ? 'text-gray-400' : 'text-primary'}>+</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <Loading fullScreen message="Loading tour details..." />;
  }

  if (error || !tour) {
    return <ErrorState message="Failed to load tour" onRetry={refetch} fullScreen />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Tour Summary */}
        <View className="bg-white px-4 py-4 mb-4">
          <Text className="text-lg font-bold text-gray-800">{tour.title}</Text>
          <Text className="text-gray-500 text-sm mt-1">
            ⏱️ {tour.duration} hours • 📍 {tour.category}
          </Text>
        </View>

        {/* Date Selection */}
        <View className="bg-white px-4 py-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Select Date 📅
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableDates.map((d) => (
              <TouchableOpacity
                key={d.date}
                onPress={() => setSelectedDate(d.date)}
                className={`w-16 py-3 mr-3 rounded-xl items-center ${
                  selectedDate === d.date ? 'bg-primary' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-xs ${
                    selectedDate === d.date ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {d.dayName}
                </Text>
                <Text
                  className={`text-xl font-bold mt-1 ${
                    selectedDate === d.date ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {d.dayNumber}
                </Text>
                <Text
                  className={`text-xs ${
                    selectedDate === d.date ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {d.month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View className="bg-white px-4 py-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Select Time ⏰
          </Text>
          <View className="flex-row flex-wrap">
            {availableTimes.map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setSelectedTime(time)}
                className={`px-4 py-3 mr-3 mb-3 rounded-xl ${
                  selectedTime === time ? 'bg-primary' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedTime === time ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Passengers */}
        <View className="bg-white px-4 py-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Passengers 👥
          </Text>

          {/* Adults */}
          <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <View>
              <Text className="text-gray-800 font-medium">Adults</Text>
              <Text className="text-gray-500 text-sm">Age 13+</Text>
            </View>
            <CounterButton
              value={adults}
              onIncrease={() => setAdults((a) => Math.min(a + 1, 10))}
              onDecrease={() => setAdults((a) => Math.max(a - 1, 1))}
              min={1}
            />
          </View>

          {/* Children */}
          <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <View>
              <Text className="text-gray-800 font-medium">Children</Text>
              <Text className="text-gray-500 text-sm">Age 2-12 (50% off)</Text>
            </View>
            <CounterButton
              value={children}
              onIncrease={() => setChildren((c) => Math.min(c + 1, 10))}
              onDecrease={() => setChildren((c) => Math.max(c - 1, 0))}
            />
          </View>

          {/* Infants */}
          <View className="flex-row justify-between items-center py-3">
            <View>
              <Text className="text-gray-800 font-medium">Infants</Text>
              <Text className="text-gray-500 text-sm">Under 2 (free)</Text>
            </View>
            <CounterButton
              value={infants}
              onIncrease={() => setInfants((i) => Math.min(i + 1, 5))}
              onDecrease={() => setInfants((i) => Math.max(i - 1, 0))}
            />
          </View>
        </View>

        {/* Price Summary */}
        <View className="bg-white px-4 py-4 mb-24">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Price Summary 💰
          </Text>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-600">
              Adults ({adults} × ${discountedPrice.toFixed(0)})
            </Text>
            <Text className="text-gray-800 font-medium">
              ${(adults * discountedPrice).toFixed(0)}
            </Text>
          </View>
          {children > 0 && (
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">
                Children ({children} × ${(discountedPrice * 0.5).toFixed(0)})
              </Text>
              <Text className="text-gray-800 font-medium">
                ${(children * discountedPrice * 0.5).toFixed(0)}
              </Text>
            </View>
          )}
          {infants > 0 && (
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Infants ({infants})</Text>
              <Text className="text-green-600 font-medium">Free</Text>
            </View>
          )}
          <View className="flex-row justify-between py-3 mt-2 border-t border-gray-200">
            <Text className="text-gray-800 font-semibold text-lg">Total</Text>
            <Text className="text-primary font-bold text-xl">
              ${totalPrice.toFixed(0)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          className={`py-4 rounded-xl items-center ${
            canContinue ? 'bg-primary' : 'bg-gray-300'
          }`}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            Continue to Details →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
