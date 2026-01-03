/**
 * Reusable Button component with multiple variants
 * Supports primary, secondary, outline, and ghost styles
 */

import React, { memo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, TouchableOpacityProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  /** Button label text */
  title: string;
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Icon to show before the title */
  leftIcon?: string;
  /** Icon to show after the title */
  rightIcon?: string;
  /** Make button full width */
  fullWidth?: boolean;
  /** Press handler */
  onPress?: () => void;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-gray-100',
    text: 'text-gray-800',
  },
  outline: {
    container: 'bg-transparent border-2 border-primary',
    text: 'text-primary',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-primary',
  },
  danger: {
    container: 'bg-red-500',
    text: 'text-white',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'py-2 px-4',
    text: 'text-sm',
  },
  md: {
    container: 'py-3 px-6',
    text: 'text-base',
  },
  lg: {
    container: 'py-4 px-8',
    text: 'text-lg',
  },
};

function ButtonComponent({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onPress,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const containerClasses = [
    'rounded-xl items-center justify-center flex-row',
    variantStyle.container,
    sizeStyle.container,
    fullWidth ? 'w-full' : 'self-start',
    isDisabled ? 'opacity-50' : '',
    className || '',
  ].join(' ');

  const textClasses = [
    'font-semibold',
    variantStyle.text,
    sizeStyle.text,
  ].join(' ');

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={containerClasses}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#1D4ED8'}
          size="small"
        />
      ) : (
        <>
          {leftIcon && <Text className="mr-2">{leftIcon}</Text>}
          <Text className={textClasses}>{title}</Text>
          {rightIcon && <Text className="ml-2">{rightIcon}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}

export const Button = memo(ButtonComponent);

export default Button;
