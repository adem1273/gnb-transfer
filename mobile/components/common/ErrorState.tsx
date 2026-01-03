/**
 * Error display component for handling error states
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorState({ 
  message = 'Something went wrong. Please try again.', 
  onRetry,
  fullScreen = false 
}: ErrorStateProps) {
  const containerClass = fullScreen 
    ? 'flex-1 items-center justify-center bg-white px-4' 
    : 'items-center justify-center py-8 px-4';

  return (
    <View className={containerClass}>
      <Text className="text-4xl mb-4">😕</Text>
      <Text className="text-gray-600 text-center text-lg mb-4">
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="bg-primary px-6 py-3 rounded-lg"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'Nothing here yet',
  message = 'There are no items to display.',
  icon = '📭',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12 px-4">
      <Text className="text-5xl mb-4">{icon}</Text>
      <Text className="text-gray-800 text-lg font-semibold mb-2 text-center">
        {title}
      </Text>
      <Text className="text-gray-500 text-center mb-4">
        {message}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-primary px-6 py-3 rounded-lg"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default ErrorState;
