import { WorkerPortrait } from "./Brand";
// ============================================================
// CoopConnect – Card, Badge, Avatar, StarRating, LoadingSpinner,
//               EmptyState, StatusBadge shared components
// ============================================================

import { Button } from "@/components/common/Button";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import { Star } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

// ─── Card ────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: any;
  padding?: number;
  onPress?: () => void;
}

export function Card({
  children,
  style,
  padding = Spacing.base,
  onPress,
}: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, { padding }, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

// ─── Badge ───────────────────────────────────────────────────

type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "danger"
  | "info"
  | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  small?: boolean;
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = "primary",
  size,
  small = false,
  style,
}: BadgeProps) {
  const isSmall = small || size === "sm";

  const bgColor: Record<BadgeVariant, string> = {
    primary: Colors.primaryLight,
    secondary: Colors.secondaryLight,
    success: Colors.successLight,
    warning: Colors.warningLight,
    error: Colors.errorLight,
    danger: Colors.errorLight,
    info: Colors.infoLight,
    neutral: Colors.surfaceSecondary,
  };

  const textColor: Record<BadgeVariant, string> = {
    primary: Colors.primary,
    secondary: Colors.secondary,
    success: Colors.success,
    warning: Colors.warningDark,
    error: Colors.error,
    danger: Colors.error,
    info: Colors.info,
    neutral: Colors.textSecondary,
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor[variant] },
        isSmall && styles.badgeSmall,
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: textColor[variant] },
          isSmall && styles.badgeTextSmall,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Avatar ──────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function Avatar({
  name,
  size = 44,
  backgroundColor,
  textColor,
  style,
}: AvatarProps) {
  const variant =
    Array.from(name || "Worker").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    4;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <WorkerPortrait size={size} variant={variant} />
    </View>
  );
}

// ─── Star Rating ─────────────────────────────────────────────

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
  showScore?: boolean;
  style?: ViewStyle;
}

export function StarRating({
  rating,
  size = 14,
  showNumber = true,
  showScore,
  style,
}: StarRatingProps) {
  const displayScore = showScore !== undefined ? showScore : showNumber;

  return (
    <View style={[styles.starRow, style]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color={i <= Math.round(rating) ? Colors.star : Colors.border}
          fill={i <= Math.round(rating) ? Colors.star : "transparent"}
        />
      ))}
      {displayScore && (
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      )}
    </View>
  );
}

// ─── Loading Spinner ─────────────────────────────────────────

interface LoadingSpinnerProps {
  label?: string;
  message?: string;
  style?: ViewStyle;
}

export function LoadingSpinner({ label, message, style }: LoadingSpinnerProps) {
  const text = message ?? label;
  return (
    <View style={[styles.loadingWrap, style]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  message?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  message,
  action,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const desc = message ?? subtitle;

  return (
    <View style={[styles.emptyWrap, style]}>
      {icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text style={styles.emptyTitle}>{title}</Text>
      {desc && <Text style={styles.emptySubtitle}>{desc}</Text>}
      {action ? (
        <View style={styles.emptyAction}>{action}</View>
      ) : actionLabel && onAction ? (
        <View style={styles.emptyAction}>
          <Button
            label={actionLabel}
            variant="primary"
            size="sm"
            onPress={onAction}
          />
        </View>
      ) : null}
    </View>
  );
}

// ─── Section Header ──────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({ title, right, style }: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  badge: {
    maxWidth: "100%",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  badgeSmall: { paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  badgeTextSmall: { fontSize: 10 },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: Typography.fontWeight.bold,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontWeight: Typography.fontWeight.medium,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyAction: { marginTop: Spacing.sm },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
});
