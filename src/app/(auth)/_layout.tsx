// ============================================================
// CoopConnect – Auth Layout
// ============================================================

import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register-customer" />
      <Stack.Screen name="register-worker" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
