// ============================================================
// CoopConnect – Booking Status Card Component
// ============================================================

import { Avatar, StarRating } from "@/components/common/UIKit";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "@/constants";
import type { Booking } from "@/types";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Zap } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
  compact?: boolean;
}

export function BookingCard({
  booking,
  onPress,
  compact = false,
}: BookingCardProps) {
  const statusColor =
    BOOKING_STATUS_COLORS[booking.status] || Colors.textSecondary;
  const statusLabel = BOOKING_STATUS_LABELS[booking.status] || booking.status;

  const formattedDate = (() => {
    try {
      return format(new Date(booking.preferredDate), "dd MMM yyyy");
    } catch {
      return booking.preferredDate;
    }
  })();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {booking.service?.name ?? "Service"}
          </Text>
          <Text style={styles.bookingId} numberOfLines={1}>
            #{booking.id.slice(-6).toUpperCase()} · Total: ₹{booking.totalAmount ?? (booking.servicePrice ? booking.servicePrice + (booking.bookingCharge ?? 100) : (booking.service?.basePrice ? booking.service.basePrice + 100 : 450))}
          </Text>
        </View>
        <View style={styles.statusRow}>
          {booking.emergency && (
            <View style={styles.emergencyBadge}>
              <Zap size={10} color={Colors.emergency} fill={Colors.emergency} />
              <Text style={styles.emergencyText}>URGENT</Text>
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}18` },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      {!compact && (
        <Text style={styles.description} numberOfLines={2}>
          {booking.description}
        </Text>
      )}

      {/* Meta */}
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Calendar size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{formattedDate}</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{booking.preferredTime}</Text>
        </View>
        {!compact && (
          <View style={styles.metaItem}>
            <MapPin size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{booking.location}</Text>
          </View>
        )}
      </View>

      {/* Worker Info */}
      {booking.worker && !compact && (
        <View style={styles.workerRow}>
          <Avatar name={booking.worker.user.name} size={32} />
          <View style={{ flex: 1 }}>
            <Text style={styles.workerName}>{booking.worker.user.name}</Text>
            <StarRating rating={booking.worker.rating} size={12} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  header: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  serviceInfo: { flex: 1, minWidth: 110, marginRight: Spacing.sm },
  serviceName: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  bookingId: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusRow: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    gap: Spacing.xs,
    alignItems: "center",
  },
  emergencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.emergencyLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  emergencyText: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.emergency,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  workerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  workerName: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
});
