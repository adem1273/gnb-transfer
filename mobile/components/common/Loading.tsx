/**
 * Loading indicator component
 */

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function Loading({ 
  message, 
  size = 'large', 
  fullScreen = false 
}: LoadingProps) {
  const containerClass = fullScreen 
    ? 'flex-1 items-center justify-center bg-white' 
    : 'items-center justify-center py-8';

  return (
    <View className={containerClass}>
      <ActivityIndicator size={size} color="#1D4ED8" />
      {message && (
        <Text className="text-gray-500 mt-3 text-center">{message}</Text>
      )}
    </View>
  );
}

export default Loading;
