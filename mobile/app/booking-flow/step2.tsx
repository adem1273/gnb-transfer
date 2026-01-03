/**
 * Booking Step 2 - Enter passenger details
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function BookingStep2() {
  const params = useLocalSearchParams<{
    tourId: string;
    date: string;
    time: string;
    adults: string;
    children: string;
    infants: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pickupLocation, setPickupLocation] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (!pickupLocation.trim()) newErrors.pickupLocation = 'Pickup location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    const newParams = new URLSearchParams({
      ...Object.fromEntries(Object.entries(params)),
      name,
      email,
      phone,
      pickupLocation,
      flightNumber,
      notes,
    });
    router.push(`/booking-flow/step3?${newParams.toString()}`);
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    keyboardType,
    autoCapitalize,
    multiline,
    icon,
    optional,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    error?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words';
    multiline?: boolean;
    icon?: string;
    optional?: boolean;
  }) => (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-2">
        {label}
        {optional && <Text className="text-gray-400"> (Optional)</Text>}
      </Text>
      <View
        className={`flex-row items-center bg-gray-50 rounded-xl px-4 border ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
      >
        {icon && <Text className="text-gray-400 mr-2">{icon}</Text>}
        <TextInput
          className={`flex-1 py-4 text-gray-800 ${multiline ? 'min-h-[80px]' : ''}`}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Booking Summary */}
        <View className="bg-white px-4 py-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Booking Summary 📋
          </Text>
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-500">Date</Text>
            <Text className="text-gray-800">{formatDate(params.date)}</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-500">Time</Text>
            <Text className="text-gray-800">{params.time}</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-500">Guests</Text>
            <Text className="text-gray-800">
              {params.adults} adult{Number(params.adults) > 1 ? 's' : ''}
              {Number(params.children) > 0 &&
                `, ${params.children} child${Number(params.children) > 1 ? 'ren' : ''}`}
              {Number(params.infants) > 0 &&
                `, ${params.infants} infant${Number(params.infants) > 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {/* Contact Details */}
        <View className="bg-white px-4 py-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Contact Details 📞
          </Text>
          <InputField
            label="Full Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((e) => ({ ...e, name: '' }));
            }}
            placeholder="Enter your full name"
            error={errors.name}
            autoCapitalize="words"
            icon="👤"
          />
          <InputField
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((e) => ({ ...e, email: '' }));
            }}
            placeholder="your@email.com"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="📧"
          />
          <InputField
            label="Phone Number"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errors.phone) setErrors((e) => ({ ...e, phone: '' }));
            }}
            placeholder="+1 234 567 8900"
            error={errors.phone}
            keyboardType="phone-pad"
            icon="📱"
          />
        </View>

        {/* Trip Details */}
        <View className="bg-white px-4 py-4 mb-24">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Trip Details 🗺️
          </Text>
          <InputField
            label="Pickup Location"
            value={pickupLocation}
            onChangeText={(text) => {
              setPickupLocation(text);
              if (errors.pickupLocation) setErrors((e) => ({ ...e, pickupLocation: '' }));
            }}
            placeholder="Hotel name or address"
            error={errors.pickupLocation}
            icon="📍"
          />
          <InputField
            label="Flight Number"
            value={flightNumber}
            onChangeText={setFlightNumber}
            placeholder="e.g., TK123"
            icon="✈️"
            optional
          />
          <InputField
            label="Special Requests"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special requests or requirements..."
            multiline
            icon="📝"
            optional
          />
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <TouchableOpacity
          onPress={handleContinue}
          className="bg-primary py-4 rounded-xl items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            Continue to Payment →
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
