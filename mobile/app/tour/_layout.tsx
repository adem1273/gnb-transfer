/**
 * Tour layout - Wraps tour detail screen
 */

import { Stack } from 'expo-router';

export default function TourLayout() {
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
        name="[id]"
        options={{
          title: 'Tour Details',
        }}
      />
    </Stack>
  );
}
