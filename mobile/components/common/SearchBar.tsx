/**
 * Reusable SearchBar component
 * Includes search icon, clear button, and filter toggle
 */

import React, { memo, useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, TextInputProps } from 'react-native';

interface SearchBarProps extends Omit<TextInputProps, 'onChangeText'> {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChangeText: (text: string) => void;
  /** Callback when search is submitted */
  onSearch?: (text: string) => void;
  /** Callback when filter button is pressed */
  onFilterPress?: () => void;
  /** Show the filter button */
  showFilter?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Container class name */
  containerClassName?: string;
  /** Auto focus the input */
  autoFocus?: boolean;
}

function SearchBarComponent({
  value,
  onChangeText,
  onSearch,
  onFilterPress,
  showFilter = false,
  placeholder = 'Search...',
  containerClassName,
  autoFocus = false,
  ...props
}: SearchBarProps) {
  const handleClear = useCallback(() => {
    onChangeText('');
    onSearch?.('');
  }, [onChangeText, onSearch]);

  const handleSubmit = useCallback(() => {
    onSearch?.(value);
  }, [onSearch, value]);

  return (
    <View className={`flex-row bg-white rounded-xl overflow-hidden shadow-sm ${containerClassName || ''}`}>
      <View className="flex-1 flex-row items-center px-3">
        <Text className="text-gray-400 mr-2">🔍</Text>
        <TextInput
          className="flex-1 py-3 text-gray-800"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          {...props}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text className="text-gray-400 text-lg">✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {showFilter && (
        <TouchableOpacity
          onPress={onFilterPress}
          className="bg-gray-100 px-4 items-center justify-center"
          activeOpacity={0.8}
        >
          <Text className="text-gray-600">⚙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export const SearchBar = memo(SearchBarComponent);

export default SearchBar;
