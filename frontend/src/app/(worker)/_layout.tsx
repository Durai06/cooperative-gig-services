import { AdaptiveNavigation } from "@/components/common/AdaptiveNavigation";
import { useResponsiveLayout } from "@/components/common/ResponsiveLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// ============================================================
// Sevai One – Worker Tab Layout
// ============================================================

import { LoadingSpinner } from "@/components/common/UIKit";
import { Colors, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Tabs } from "expo-router";
import {
  Briefcase,
  CalendarClock,
  IndianRupee,
  UserCheck,
} from "lucide-react-native";
import React from "react";

export default function WorkerLayout() {
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsiveLayout();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect href="/roles" />;
  if (user?.role !== "worker") return <Redirect href="/roles" />;

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
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Briefcase size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="requests" options={{ href: null }} />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color, size }) => (
            <Briefcase size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: "Schedule",
          href: null,
          tabBarIcon: ({ color, size }) => (
            <CalendarClock size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => (
            <IndianRupee size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <UserCheck size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
