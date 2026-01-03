/**
 * Reusable Input component with label, error, and icon support
 */

import React, { memo, forwardRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  /** Label displayed above the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Icon displayed on the left side */
  leftIcon?: string;
  /** Icon displayed on the right side */
  rightIcon?: string;
  /** Callback when right icon is pressed */
  onRightIconPress?: () => void;
  /** Make the input take full width */
  fullWidth?: boolean;
  /** Show required indicator */
  required?: boolean;
  /** Container class name */
  containerClassName?: string;
}

const InputComponent = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconPress,
      fullWidth = true,
      required = false,
      containerClassName,
      editable = true,
      className,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const containerClasses = [
      fullWidth ? 'w-full' : '',
      containerClassName || '',
    ].join(' ');

    const inputContainerClasses = [
      'flex-row items-center bg-gray-50 rounded-xl px-4 border',
      error ? 'border-red-400' : isFocused ? 'border-primary' : 'border-gray-200',
      !editable ? 'bg-gray-100 opacity-60' : '',
    ].join(' ');

    const inputClasses = [
      'flex-1 py-4 text-gray-800',
      leftIcon ? 'ml-2' : '',
      rightIcon ? 'mr-2' : '',
      className || '',
    ].join(' ');

    return (
      <View className={containerClasses}>
        {label && (
          <View className="flex-row mb-2">
            <Text className="text-gray-700 font-medium">{label}</Text>
            {required && <Text className="text-red-500 ml-1">*</Text>}
          </View>
        )}
        <View className={inputContainerClasses}>
          {leftIcon && <Text className="text-gray-400">{leftIcon}</Text>}
          <TextInput
            ref={ref}
            className={inputClasses}
            placeholderTextColor="#9CA3AF"
            editable={editable}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && (
            onRightIconPress ? (
              <TouchableOpacity onPress={onRightIconPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text className="text-gray-400">{rightIcon}</Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-gray-400">{rightIcon}</Text>
            )
          )}
        </View>
        {error && (
          <Text className="text-red-500 text-sm mt-1">{error}</Text>
        )}
        {helperText && !error && (
          <Text className="text-gray-500 text-sm mt-1">{helperText}</Text>
        )}
      </View>
    );
  }
);

InputComponent.displayName = 'Input';

export const Input = memo(InputComponent);

export default Input;
