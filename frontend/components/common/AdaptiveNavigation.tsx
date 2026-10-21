import React from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Settings, LogOut } from "lucide-react-native";
import { Brand } from "./Brand";
import { useResponsiveLayout } from "./ResponsiveLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants";

export function AdaptiveNavigation(props: BottomTabBarProps) {
  const { width, sidebarWidth, isDesktop } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  if (width < 768) return <BottomTabBar {...props} />;
  const routes = props.state.routes.filter((route) => {
    const options = props.descriptors[route.key]
      .options as (typeof props.descriptors)[string]["options"] & {
      href?: string | null;
    };
    return (
      options.href !== null &&
      ![
        "settings",
        "verification",
        "notifications",
        "availability",
        "requests",
      ].includes(route.name)
    );
  });
  return (
    <View
      accessibilityLabel="Main navigation"
      style={{
        width: sidebarWidth,
        paddingTop: insets.top + 28,
        paddingBottom: Math.max(insets.bottom, 20),
        backgroundColor: "#fff",
        borderRightWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <View
        style={{ paddingHorizontal: isDesktop ? 18 : 10, marginBottom: 32 }}
      >
        {isDesktop ? (
          <Brand compact />
        ) : (
          <Text
            style={{
              color: Colors.primaryDark,
              fontWeight: "800",
              fontSize: 17,
              textAlign: "center",
            }}
          >
            Coop{"\n"}Connect
          </Text>
        )}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {routes.map((route) => {
          const options = props.descriptors[route.key].options;
          const selected =
            props.state.routes[props.state.index].key === route.key;
          const color = selected ? Colors.primary : Colors.textSecondary;
          const label = options.title ?? route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              aria-selected={selected}
              onPress={() => {
                const event = props.navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented)
                  props.navigation.navigate(route.name, route.params);
              }}
              onLongPress={() =>
                props.navigation.emit({
                  type: "tabLongPress",
                  target: route.key,
                })
              }
              style={{
                flexDirection: isDesktop ? "row" : "column",
                alignItems: "center",
                gap: isDesktop ? 12 : 7,
                minHeight: 54,
                padding: 12,
                borderRadius: 12,
                backgroundColor: selected ? "#EAF2FF" : "transparent",
              }}
            >
              {options.tabBarIcon?.({ focused: selected, color, size: 22 })}
              <Text
                style={{
                  color,
                  fontSize: isDesktop ? 14 : 11,
                  fontWeight: selected ? "700" : "500",
                  flexShrink: 1,
                  textAlign: isDesktop ? "left" : "center",
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {user?.role === "admin" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => router.push("/(admin)/settings")}
          style={{
            padding: 18,
            flexDirection: isDesktop ? "row" : "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Settings size={20} color={Colors.textSecondary} />
          <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
            Settings
          </Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign Out"
        onPress={async () => {
          await logout();
          router.replace("/");
        }}
        style={{
          padding: 18,
          flexDirection: isDesktop ? "row" : "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <LogOut size={20} color={Colors.textSecondary} />
        <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
          Sign Out
        </Text>
      </Pressable>
    </View>
  );
}
