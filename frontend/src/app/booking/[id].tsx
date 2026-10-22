import { Alert } from "@/components/common/Feedback";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
// ============================================================
// Sevai One – Booking Detail Screen
// ============================================================

import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import {
  Avatar,
  Card,
  LoadingSpinner,
  StarRating,
} from "@/components/common/UIKit";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  Colors,
  Radius,
  Spacing,
  Typography,
} from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/api/bookingService";
import type { Booking } from "@/types";
import { format } from "date-fns";

import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  MapPin,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PageFrame } from "@/components/common/ResponsiveLayout";

const STATUS_STEPS = [
  "pending",
  "worker_assigned",
  "accepted",
  "in_progress",
  "completed",
];

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await bookingService.getBookingById(id);
      setBooking(data ?? null);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const cancelBooking = async () => {
    if (!booking) return;
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "Keep Booking", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              const updated = await bookingService.cancelBooking(booking.id);
              setBooking(updated);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  if (loading) return <LoadingSpinner label="Loading booking…" />;
  if (!booking)
    return (
      <PageFrame maxWidth={900} style={styles.safe}>
        <ScreenHeader title="Booking" showBack />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>
            {error || "Booking not found."}
          </Text>
          <Button label="Retry" onPress={load} />
        </View>
      </PageFrame>
    );

  const statusColor =
    BOOKING_STATUS_COLORS[booking.status] ?? Colors.textSecondary;
  const statusLabel = BOOKING_STATUS_LABELS[booking.status] ?? booking.status;
  const currentStep = STATUS_STEPS.indexOf(booking.status);
  const canCancel =
    (user?.role === "customer" || user?.role === "admin") &&
    ["pending", "worker_assigned", "accepted"].includes(booking.status);
  const canReview = booking.status === "completed" && user?.role === "customer";
  const canComplain = user?.role === "customer";

  const formattedDate = (() => {
    try {
      return format(new Date(booking.preferredDate), "EEEE, dd MMMM yyyy");
    } catch {
      return booking.preferredDate;
    }
  })();

  return (
    <PageFrame maxWidth={900} style={styles.safe}>
      <ScreenHeader title="Booking Details" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusColor}18` },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusLabel, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
            {booking.emergency && (
              <View style={styles.emergencyTag}>
                <Zap
                  size={12}
                  color={Colors.emergency}
                  fill={Colors.emergency}
                />
                <Text style={styles.emergencyText}>URGENT</Text>
              </View>
            )}
          </View>

          {/* Progress stepper */}
          {booking.status !== "cancelled" && (
            <View style={styles.stepper}>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const isLast = i === STATUS_STEPS.length - 1;
                return (
                  <React.Fragment key={step}>
                    <View style={[styles.stepDot, done && styles.stepDotDone]}>
                      {done && (
                        <CheckCircle size={14} color={Colors.textInverse} />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.stepLine,
                          i < currentStep && styles.stepLineDone,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}

          <Text
            style={{
              fontSize: 10,
              color: Colors.textSecondary,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            Pending → Assigned → Accepted → In Progress → Completed
          </Text>
          <Text style={styles.bookingId}>
            Booking #{booking.id.slice(-6).toUpperCase()}
          </Text>
        </Card>

        {/* Service Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Service</Text>
          <Text style={styles.serviceNameText}>
            {booking.service?.name ?? "Service"}
          </Text>
          <Text style={styles.descText}>{booking.description}</Text>
          {booking.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Additional Notes</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          )}
        </Card>

        {/* Schedule & Location */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule & Location</Text>
          <View style={styles.metaItem}>
            <Calendar size={16} color={Colors.primary} />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={16} color={Colors.primary} />
            <Text style={styles.metaText}>{booking.preferredTime}</Text>
          </View>
          <View style={styles.metaItem}>
            <MapPin size={16} color={Colors.primary} />
            <Text style={styles.metaText}>{booking.location}</Text>
          </View>
        </Card>

        {/* Worker */}
        {booking.worker && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Worker</Text>
            <TouchableOpacity
              style={styles.workerRow}
              onPress={() => router.push(`/worker/${booking.workerId}`)}
            >
              <Avatar name={booking.worker.user.name} size={52} />
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>
                  {booking.worker.user.name}
                </Text>
                <StarRating rating={booking.worker.rating} size={14} />
                <Text style={styles.workerMeta}>
                  {booking.worker.experience}y experience ·{" "}
                  {booking.worker.totalRatings} reviews
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        )}

        {user?.role === "customer" && booking.status === "pending" && (
          <Button
            label="Find Available Workers"
            onPress={() =>
              router.push(`/booking/workers?bookingId=${booking.id}`)
            }
            fullWidth
          />
        )}
        {/* Actions */}
        <View style={styles.actions}>
          {canReview && (
            <Button
              label="⭐ Leave a Review"
              onPress={() => router.push(`/rating/${booking.id}`)}
              fullWidth
              size="lg"
              style={{ marginBottom: Spacing.md }}
            />
          )}
          {canComplain && (
            <Button
              label="Report a Problem"
              variant="outline"
              onPress={() => router.push(`/complaint/${booking.id}`)}
              fullWidth
              size="md"
              style={{ marginBottom: Spacing.md }}
            />
          )}
          {canCancel && (
            <Button
              label="Cancel Booking"
              variant="danger"
              onPress={cancelBooking}
              loading={cancelling}
              fullWidth
              size="md"
            />
          )}
        </View>
      </ScrollView>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  statusCard: { marginBottom: Spacing.md, gap: Spacing.md },
  statusRow: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
  emergencyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.emergencyLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  emergencyText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.emergency,
  },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotDone: { backgroundColor: Colors.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border },
  stepLineDone: { backgroundColor: Colors.primary },
  bookingId: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontFamily: "monospace",
  },
  section: { marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  serviceNameText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  descText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  notesBox: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.divider,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  notesLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  notesText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metaText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  workerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  workerInfo: { flex: 1, gap: 4 },
  workerName: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  workerMeta: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  actions: { marginTop: Spacing.sm },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
});
