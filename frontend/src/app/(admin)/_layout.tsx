import { AdaptiveNavigation } from "@/components/common/AdaptiveNavigation";
import { useResponsiveLayout } from "@/components/common/ResponsiveLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// ============================================================
// Sevai One – Administrator Tab Layout
// ============================================================

import { LoadingSpinner } from "@/components/common/UIKit";
import { Colors, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Tabs } from "expo-router";
import {
  AlertCircle,
  BarChart3,
  CalendarCheck,
  LayoutDashboard,
  Users,
} from "lucide-react-native";
import React from "react";

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsiveLayout();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect href="/roles" />;
  if (user?.role !== "admin") return <Redirect href="/roles" />;

  return (
    <Tabs
      tabBar={(props) => <AdaptiveNavigation {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isTablet ? "left" : "bottom",
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.cardBackground,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.medium,
        },
      }}
    >
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="verification" options={{ href: null }} />
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: "Workers",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: "Complaints",
          tabBarIcon: ({ color, size }) => (
            <AlertCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
