// ============================================================
// CoopConnect – Root Layout (_layout.tsx)
// Handles font loading, auth session restore, and routing.
// ============================================================

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(worker)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen
              name="booking/[id]"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="booking/create"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="booking/workers"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="worker/[id]"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="rating/[bookingId]"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="complaint/[bookingId]"
              options={{ presentation: 'modal' }}
            />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
