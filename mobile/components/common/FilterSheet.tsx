/**
 * Reusable FilterSheet component
 * A bottom sheet modal for filter options
 */

import React, { memo, ReactNode } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface FilterOption<T = string> {
  value: T;
  label: string;
}

interface FilterSheetProps<T = string> {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback to close the sheet */
  onClose: () => void;
  /** Title of the filter sheet */
  title: string;
  /** Filter options to display */
  options?: FilterOption<T>[];
  /** Currently selected value(s) */
  selectedValue?: T | T[];
  /** Callback when an option is selected */
  onSelect?: (value: T) => void;
  /** Apply button text */
  applyText?: string;
  /** Callback when apply is pressed */
  onApply?: () => void;
  /** Clear button text */
  clearText?: string;
  /** Callback when clear is pressed */
  onClear?: () => void;
  /** Custom content to render instead of options */
  children?: ReactNode;
  /** Allow multiple selection */
  multiSelect?: boolean;
}

function FilterSheetComponent<T extends string = string>({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  applyText = 'Apply Filters',
  onApply,
  clearText = 'Clear All',
  onClear,
  children,
  multiSelect = false,
}: FilterSheetProps<T>) {
  const isSelected = (value: T): boolean => {
    if (Array.isArray(selectedValue)) {
      return selectedValue.includes(value);
    }
    return selectedValue === value;
  };

  const handleApply = () => {
    onApply?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-3xl max-h-[80%]">
          {/* Handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-800">{title}</Text>
            {onClear && (
              <TouchableOpacity onPress={onClear}>
                <Text className="text-primary text-sm font-medium">{clearText}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
            {children ? (
              children
            ) : options ? (
              <View className="flex-row flex-wrap">
                {options.map((option) => {
                  const selected = isSelected(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => onSelect?.(option.value)}
                      className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                        selected ? 'bg-primary' : 'bg-gray-100'
                      }`}
                      activeOpacity={0.8}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </ScrollView>

          {/* Apply Button */}
          <View className="px-6 pb-8 pt-4">
            <TouchableOpacity
              onPress={handleApply}
              className="bg-primary py-4 rounded-xl items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">{applyText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const FilterSheet = memo(FilterSheetComponent) as typeof FilterSheetComponent;

export default FilterSheet;
