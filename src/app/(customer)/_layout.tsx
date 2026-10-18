import { AdaptiveNavigation } from "@/components/common/AdaptiveNavigation";
import { useResponsiveLayout } from "@/components/common/ResponsiveLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// ============================================================
// CoopConnect – Customer Tab Layout
// ============================================================

import { LoadingSpinner } from "@/components/common/UIKit";
import { Colors, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Tabs } from "expo-router";
import { Bell, CalendarCheck, Grid3x3, Home, User } from "lucide-react-native";
import React from "react";

export default function CustomerLayout() {
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsiveLayout();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect href="/" />;
  if (user?.role !== "customer") return <Redirect href="/" />;

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
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, size }) => (
            <Grid3x3 size={size} color={color} />
          ),
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
        name="notifications"
        options={{
          href: null,
          title: "Notifications",
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
