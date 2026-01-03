/**
 * Payment routes layout - Handles PayTR callback deep links
 */

import { Stack } from 'expo-router';

export default function PaymentLayout() {
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
        headerBackVisible: false,
      }}
    >
      <Stack.Screen
        name="success"
        options={{
          title: 'Payment Successful',
        }}
      />
      <Stack.Screen
        name="failed"
        options={{
          title: 'Payment Failed',
        }}
      />
    </Stack>
  );
}
