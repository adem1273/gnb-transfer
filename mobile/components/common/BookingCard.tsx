/**
 * Booking card component for displaying booking information
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Booking, Tour } from '@gnb-transfer/shared';

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  paid: { bg: 'bg-purple-100', text: 'text-purple-800' },
};

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const router = useRouter();
  const tour = booking.tour as Tour | undefined;
  const statusStyle = statusColors[booking.status] || statusColors.pending;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (tour) {
      const tourId = typeof tour === 'object' ? (tour.id || tour._id) : tour;
      router.push(`/tour/${tourId}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white rounded-xl p-4 mb-4 shadow-sm"
      activeOpacity={0.8}
    >
      <View className="flex-row">
        <View className="w-16 h-16 bg-gray-200 rounded-lg items-center justify-center">
          <Text className="text-2xl">🗺️</Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-gray-800 font-semibold text-base" numberOfLines={1}>
            {tour && typeof tour === 'object' ? tour.title : `Booking #${booking.id?.slice(-6) || booking._id?.slice(-6)}`}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            {formatDate(booking.date)}
            {booking.time && ` at ${booking.time}`}
          </Text>
          <View className={`self-start px-2 py-1 rounded mt-2 ${statusStyle.bg}`}>
            <Text className={`text-xs font-medium capitalize ${statusStyle.text}`}>
              {booking.status}
            </Text>
          </View>
        </View>
      </View>
      <View className="flex-row justify-between pt-3 mt-3 border-t border-gray-100">
        <Text className="text-gray-500 text-sm">
          👥 {booking.guests} guest{booking.guests > 1 ? 's' : ''}
        </Text>
        <Text className="text-primary font-semibold">
          ${booking.amount?.toFixed(0) || '—'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default BookingCard;
