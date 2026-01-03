/**
 * Register Screen - User registration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { registerSchema } from '@gnb-transfer/shared';
import * as yup from 'yup';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = async () => {
    try {
      // First validate with schema
      await registerSchema.validate({ name, email, password }, { abortEarly: false });

      // Then check password confirmation
      if (password !== confirmPassword) {
        setErrors({ confirmPassword: 'Passwords do not match' });
        return false;
      }

      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const newErrors: typeof errors = {};
        err.inner.forEach((e) => {
          if (e.path) {
            newErrors[e.path as keyof typeof newErrors] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleRegister = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setIsLoading(true);
    try {
      await register({ name, email, password });
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-4">
          {/* Header */}
          <View className="items-center mb-6">
            <Text className="text-4xl mb-2">🚐</Text>
            <Text className="text-2xl font-bold text-gray-800">Create Account</Text>
            <Text className="text-gray-500 mt-1">Join us for amazing tours!</Text>
          </View>

          {/* Form */}
          <View className="space-y-3">
            {/* Name Input */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Full Name</Text>
              <View
                className={`flex-row items-center bg-gray-50 rounded-xl px-4 border ${
                  errors.name ? 'border-red-400' : 'border-gray-200'
                }`}
              >
                <Text className="text-gray-400 mr-2">👤</Text>
                <TextInput
                  className="flex-1 py-4 text-gray-800"
                  placeholder="Your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                  }}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && (
                <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
              )}
            </View>

            {/* Email Input */}
            <View className="mt-3">
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <View
                className={`flex-row items-center bg-gray-50 rounded-xl px-4 border ${
                  errors.email ? 'border-red-400' : 'border-gray-200'
                }`}
              >
                <Text className="text-gray-400 mr-2">📧</Text>
                <TextInput
                  className="flex-1 py-4 text-gray-800"
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View className="mt-3">
              <Text className="text-gray-700 font-medium mb-2">Password</Text>
              <View
                className={`flex-row items-center bg-gray-50 rounded-xl px-4 border ${
                  errors.password ? 'border-red-400' : 'border-gray-200'
                }`}
              >
                <Text className="text-gray-400 mr-2">🔒</Text>
                <TextInput
                  className="flex-1 py-4 text-gray-800"
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text className="text-gray-400">{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View className="mt-3">
              <Text className="text-gray-700 font-medium mb-2">Confirm Password</Text>
              <View
                className={`flex-row items-center bg-gray-50 rounded-xl px-4 border ${
                  errors.confirmPassword ? 'border-red-400' : 'border-gray-200'
                }`}
              >
                <Text className="text-gray-400 mr-2">🔒</Text>
                <TextInput
                  className="flex-1 py-4 text-gray-800"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword)
                      setErrors((e) => ({ ...e, confirmPassword: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
              {errors.confirmPassword && (
                <Text className="text-red-500 text-sm mt-1">{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Terms */}
            <Text className="text-gray-500 text-xs text-center mt-4">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              className={`bg-primary py-4 rounded-xl items-center mt-4 ${
                isLoading ? 'opacity-70' : ''
              }`}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center items-center mt-6 pb-8">
            <Text className="text-gray-500">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
