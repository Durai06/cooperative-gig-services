import { useResponsiveLayout } from "./ResponsiveLayout";
// ============================================================
// CoopConnect – Screen Header Component
// ============================================================

import { Colors, Spacing, Typography } from "@/constants";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
  transparent?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  right,
  style,
  transparent = false,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsiveLayout();

  return (
    <View
      style={[
        styles.container,
        !transparent && styles.solidBg,
        { paddingTop: Spacing.sm },
        style,
      ]}
    >
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
            onPress={() =>
              onBack ? onBack() : router.canGoBack() ? router.back() : router.replace("/")
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft
              size={22}
              color={transparent ? Colors.textInverse : Colors.textPrimary}
            />
          </TouchableOpacity>
        )}
        <View style={styles.titleWrap}>
          <Text
            style={[
              styles.title,
              { fontSize: isDesktop ? 22 : isTablet ? 20 : 18 },
              transparent && { color: Colors.textInverse },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                transparent && { color: "rgba(255,255,255,0.8)" },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {right && <View style={styles.rightSlot}>{right}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  solidBg: {
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  backButton: {
    padding: 10,
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rightSlot: {},
});
