// ============================================================
// CoopConnect – Reusable Button Component
// ============================================================

import { Colors, Radius, Spacing, Typography } from "@/constants";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

type Variant =
  "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  onPress: () => void;
  label?: string;
  title?: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

export function Button({
  onPress,
  label,
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
}: ButtonProps) {
  const displayText = title ?? label ?? "";
  const isDisabled = disabled || loading;

  const containerStyles: (ViewStyle | undefined)[] = [
    styles.base,
    styles[variant],
    styles[`size_${size}`] as ViewStyle,
    fullWidth ? { alignSelf: "stretch" } : undefined,
    isDisabled ? styles.disabled : undefined,
    style,
  ];

  const labelStyles: (TextStyle | undefined)[] = [
    styles.label,
    styles[`label_${variant}`] as TextStyle,
    styles[`labelSize_${size}`] as TextStyle,
    textStyle,
  ];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={displayText}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={containerStyles as any}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "ghost"
              ? Colors.primary
              : Colors.textInverse
          }
        />
      ) : (
        <>
          {leftIcon}
          <Text style={labelStyles as any}>{displayText}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    maxWidth: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.base,
    minHeight: 46,
    gap: Spacing.xs,
  },
  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: Colors.error,
  },
  success: {
    backgroundColor: Colors.success,
  },
  disabled: {
    opacity: 0.5,
  },
  // Sizes
  size_sm: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  size_md: { paddingVertical: 11, paddingHorizontal: Spacing.lg },
  size_lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  // Labels
  label: {
    flexShrink: 1,
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: "center",
  },
  label_primary: { color: Colors.textInverse },
  label_secondary: { color: Colors.textInverse },
  label_outline: { color: Colors.primary },
  label_ghost: { color: Colors.primary },
  label_danger: { color: Colors.textInverse },
  label_success: { color: Colors.textInverse },
  labelSize_sm: { fontSize: Typography.fontSize.sm },
  labelSize_md: { fontSize: Typography.fontSize.md },
  labelSize_lg: { fontSize: Typography.fontSize.lg },
});
