/**
 * ProfileScreen - User profile, settings, language selector, and logout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage, setLanguage } from '@gnb-transfer/shared';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileSkeleton } from '../../components/skeleton/Skeleton';

interface MenuItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, value, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center p-4 bg-white rounded-xl mb-3"
      activeOpacity={0.7}
    >
      <Text className="text-xl mr-3">{icon}</Text>
      <View className="flex-1">
        <Text className={`text-base ${danger ? 'text-red-500' : 'text-gray-800'}`}>
          {label}
        </Text>
      </View>
      {value && <Text className="text-gray-500 text-sm">{value}</Text>}
      {!danger && <Text className="text-gray-400 ml-2">›</Text>}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleLanguageChange = async (langCode: string) => {
    setCurrentLang(langCode);
    await changeLanguage(langCode);
    await setLanguage(langCode);
    setShowLanguageModal(false);
  };

  const getCurrentLanguageLabel = () => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang);
    return lang ? `${lang.flag} ${lang.label}` : currentLang;
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-5xl mb-4">👤</Text>
        <Text className="text-gray-800 text-xl font-bold mb-2">Welcome!</Text>
        <Text className="text-gray-500 text-center mb-6">
          Sign in to view your profile and manage your account
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          className="bg-primary px-8 py-4 rounded-xl"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          className="mt-4"
          activeOpacity={0.8}
        >
          <Text className="text-primary font-medium">Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-primary px-4 pt-6 pb-12">
        <View className="items-center">
          <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-3">
            <Text className="text-5xl">👤</Text>
          </View>
          <Text className="text-white text-xl font-bold">{user?.name}</Text>
          <Text className="text-blue-100 text-sm mt-1">{user?.email}</Text>
          {user?.role && user.role !== 'user' && (
            <View className="bg-white/20 px-3 py-1 rounded-full mt-2">
              <Text className="text-white text-xs font-medium uppercase">
                {user.role}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Menu Items */}
      <View className="px-4 -mt-6">
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <Text className="text-gray-500 text-sm font-medium mb-3">Account</Text>
          <MenuItem
            icon="📋"
            label="My Bookings"
            onPress={() => router.push('/(tabs)/bookings')}
          />
          <MenuItem
            icon="👤"
            label="Edit Profile"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
          />
        </View>

        <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <Text className="text-gray-500 text-sm font-medium mb-3">Settings</Text>
          <MenuItem
            icon="🌐"
            label="Language"
            value={getCurrentLanguageLabel()}
            onPress={() => setShowLanguageModal(true)}
          />
          <MenuItem
            icon="🔔"
            label="Notifications"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon!')}
          />
          <MenuItem
            icon="🔒"
            label="Privacy & Security"
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')}
          />
        </View>

        <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <Text className="text-gray-500 text-sm font-medium mb-3">Support</Text>
          <MenuItem
            icon="❓"
            label="Help & FAQ"
            onPress={() => Alert.alert('Coming Soon', 'Help center will be available soon!')}
          />
          <MenuItem
            icon="📧"
            label="Contact Us"
            onPress={() => Alert.alert('Contact', 'Email: support@gnbtransfer.com')}
          />
          <MenuItem
            icon="📜"
            label="Terms & Conditions"
            onPress={() => Alert.alert('Coming Soon', 'Terms will be available soon!')}
          />
        </View>

        <View className="mb-8">
          <MenuItem
            icon="🚪"
            label="Logout"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowLanguageModal(false)}
        >
          <Pressable className="bg-white rounded-t-3xl max-h-[70%]">
            <View className="p-6 border-b border-gray-100">
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
              <Text className="text-xl font-bold text-gray-800">Select Language</Text>
            </View>
            <ScrollView className="p-4">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  className={`flex-row items-center p-4 rounded-xl mb-2 ${
                    currentLang === lang.code ? 'bg-primary/10' : 'bg-gray-50'
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className="text-2xl mr-3">{lang.flag}</Text>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">{lang.label}</Text>
                    <Text className="text-gray-500 text-sm">{lang.nativeName}</Text>
                  </View>
                  {currentLang === lang.code && (
                    <Text className="text-primary text-lg">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
