/**
 * Booking flow layout - Multi-step booking process
 */

import { Stack } from 'expo-router';

export default function BookingFlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1D4ED8',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="step1"
        options={{
          title: 'Select Date & Guests',
        }}
      />
      <Stack.Screen
        name="step2"
        options={{
          title: 'Your Details',
        }}
      />
      <Stack.Screen
        name="step3"
        options={{
          title: 'Payment',
        }}
      />
      <Stack.Screen
        name="confirmation"
        options={{
          title: 'Booking Confirmed',
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
