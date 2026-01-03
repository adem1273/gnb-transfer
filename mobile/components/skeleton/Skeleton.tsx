/**
 * Skeleton loading components for loading states
 */

import React from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, className }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      className={className}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
      ]}
    />
  );
}

export function TourCardSkeleton() {
  return (
    <View className="bg-white rounded-xl overflow-hidden mb-4 shadow-sm">
      <Skeleton height={160} borderRadius={0} />
      <View className="p-4">
        <Skeleton width="80%" height={20} className="mb-2" />
        <Skeleton width="60%" height={16} className="mb-3" />
        <View className="flex-row justify-between items-center">
          <Skeleton width={80} height={24} />
          <Skeleton width={60} height={16} />
        </View>
      </View>
    </View>
  );
}

export function BookingCardSkeleton() {
  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <View className="flex-row mb-3">
        <Skeleton width={60} height={60} borderRadius={8} />
        <View className="flex-1 ml-3">
          <Skeleton width="70%" height={18} className="mb-2" />
          <Skeleton width="50%" height={14} className="mb-2" />
          <Skeleton width={60} height={20} borderRadius={10} />
        </View>
      </View>
      <View className="flex-row justify-between pt-3 border-t border-gray-100">
        <Skeleton width={100} height={14} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View className="p-4">
      <View className="items-center mb-6">
        <Skeleton width={100} height={100} borderRadius={50} className="mb-4" />
        <Skeleton width={150} height={24} className="mb-2" />
        <Skeleton width={200} height={16} />
      </View>
      <View className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-row items-center p-4 bg-white rounded-lg">
            <Skeleton width={24} height={24} borderRadius={4} />
            <Skeleton width="60%" height={18} className="ml-3" />
          </View>
        ))}
      </View>
    </View>
  );
}

export function TourDetailSkeleton() {
  return (
    <View className="flex-1 bg-white">
      <Skeleton height={300} borderRadius={0} />
      <View className="p-4">
        <Skeleton width="90%" height={28} className="mb-2" />
        <Skeleton width="60%" height={20} className="mb-4" />
        <View className="flex-row justify-between mb-6">
          <Skeleton width={100} height={32} />
          <Skeleton width={80} height={20} />
        </View>
        <Skeleton height={120} className="mb-4" />
        <Skeleton height={80} className="mb-4" />
      </View>
    </View>
  );
}

export default Skeleton;
