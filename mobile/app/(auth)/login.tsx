/**
 * Login Screen - User authentication
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
import { loginSchema } from '@gnb-transfer/shared';
import * as yup from 'yup';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = async () => {
    try {
      await loginSchema.validate({ email, password }, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const newErrors: { email?: string; password?: string } = {};
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

  const handleLogin = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setIsLoading(true);
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error?.message || 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', message);
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
        <View className="flex-1 px-6 pt-8">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-4xl mb-2">🚐</Text>
            <Text className="text-2xl font-bold text-gray-800">Welcome Back!</Text>
            <Text className="text-gray-500 mt-1">Sign in to continue</Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* Email Input */}
            <View>
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
            <View className="mt-4">
              <Text className="text-gray-700 font-medium mb-2">Password</Text>
              <View
                className={`flex-row items-center bg-gray-50 rounded-xl px-4 border ${
                  errors.password ? 'border-red-400' : 'border-gray-200'
                }`}
              >
                <Text className="text-gray-400 mr-2">🔒</Text>
                <TextInput
                  className="flex-1 py-4 text-gray-800"
                  placeholder="Enter your password"
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

            {/* Forgot Password */}
            <TouchableOpacity className="self-end mt-2">
              <Text className="text-primary text-sm">Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              className={`bg-primary py-4 rounded-xl items-center mt-6 ${
                isLoading ? 'opacity-70' : ''
              }`}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-gray-500">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-primary font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Access */}
          <View className="items-center mt-6 pb-8">
            <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
              <Text className="text-gray-400">Continue as Guest →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
