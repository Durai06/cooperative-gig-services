import { Alert } from "@/components/common/Feedback";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
// ============================================================
// Sevai One – Booking Detail Screen
// With Timeline Stepper, Price Breakdown, Payment Status,
// and Status-Appropriate Actions (Cancel, Book Again, Review, Complaint)
// ============================================================

import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ServiceIcon } from "@/components/common/ServiceIcon";
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
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Star,
  Users,
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
  { key: "pending", label: "Requested" },
  { key: "worker_assigned", label: "Assigned" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
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
    }, [load])
  );

  const cancelBooking = async () => {
    if (!booking) return;
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? A notification will be sent to the assigned professional.",
      [
        { text: "Keep Booking", style: "cancel" },
        {
          text: "Yes, Cancel Booking",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              const updated = await bookingService.cancelBooking(booking.id);
              setBooking(updated);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to cancel booking.");
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleBookAgain = () => {
    if (!booking) return;
    const svcId = booking.serviceId || booking.service?.id;
    if (svcId) {
      router.push(`/booking/create?service=${svcId}`);
    } else {
      router.push("/booking/create");
    }
  };

  if (loading) return <LoadingSpinner label="Loading booking details…" />;

  if (!booking) {
    return (
      <PageFrame maxWidth={900} style={styles.safe}>
        <ScreenHeader title="Booking Details" showBack />
        <View style={styles.notFound}>
          <AlertCircle size={40} color={Colors.error} />
          <Text style={styles.notFoundText}>{error || "Booking not found."}</Text>
          <Button label="Retry" onPress={load} />
        </View>
      </PageFrame>
    );
  }

  const statusColor = BOOKING_STATUS_COLORS[booking.status] ?? Colors.textSecondary;
  const statusLabel = BOOKING_STATUS_LABELS[booking.status] ?? booking.status;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === booking.status);

  // Status-appropriate permissions
  const canCancel =
    (user?.role === "customer" || user?.role === "admin" || (user?.role === "worker" && booking.workerId)) &&
    ["pending", "worker_assigned", "accepted"].includes(booking.status);
  const canReview = booking.status === "completed" && user?.role === "customer";
  const canComplain = user?.role === "customer" && booking.status !== "pending";
  const canBookAgain = ["completed", "cancelled"].includes(booking.status);

  const formattedDate = (() => {
    try {
      return format(new Date(booking.preferredDate), "EEEE, dd MMMM yyyy");
    } catch {
      return booking.preferredDate;
    }
  })();

  const serviceFee = booking.servicePrice ?? (booking.service?.basePrice || 350);
  const bookingCharge = booking.bookingCharge ?? 100;
  const totalAmount = booking.totalAmount ?? (serviceFee + bookingCharge);
  const paymentStatus = booking.paymentStatus || "pending";
  const isPaid = paymentStatus === "paid";

  return (
    <PageFrame maxWidth={900} style={styles.safe}>
      <ScreenHeader title="Booking Details" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Status & Timeline Stepper Card ── */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusLabel, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>

            {booking.emergency && (
              <View style={styles.emergencyTag}>
                <Zap size={12} color={Colors.emergency} fill={Colors.emergency} />
                <Text style={styles.emergencyText}>URGENT</Text>
              </View>
            )}

            <Text style={styles.bookingId}>
              #{booking.id.slice(-6).toUpperCase()}
            </Text>
          </View>

          {/* Progress Timeline Stepper */}
          {booking.status !== "cancelled" ? (
            <View style={styles.stepperContainer}>
              <View style={styles.stepperLineTrack} />
              <View style={styles.stepperRow}>
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <View key={step.key} style={styles.stepperCol}>
                      <View
                        style={[
                          styles.stepCircle,
                          isDone && styles.stepCircleDone,
                          isCurrent && styles.stepCircleCurrent,
                        ]}
                      >
                        {isDone ? (
                          <CheckCircle2 size={14} color="#FFFFFF" />
                        ) : (
                          <View style={styles.stepCircleUnfinished} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stepColText,
                          isCurrent && styles.stepColTextCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.cancelledBanner}>
              <AlertTriangle size={16} color="#DC2626" />
              <Text style={styles.cancelledText}>This booking was cancelled.</Text>
            </View>
          )}
        </Card>

        {/* ── 2. Service & Work Details Card ── */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            {booking.service && (
              <ServiceIcon category={booking.service.category} size={40} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceNameText}>
                {booking.service?.name ?? "Professional Service"}
              </Text>
              <Text style={styles.serviceCategoryText}>
                Cooperative Category: {booking.service?.category?.replace("_", " ") || "Trade"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.detailLabel}>Problem Description</Text>
          <Text style={styles.descText}>{booking.description}</Text>

          {booking.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Customer Instructions / Notes</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          )}
        </Card>

        {/* ── 3. Schedule & Location Card ── */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule & Location</Text>

          <View style={styles.metaItem}>
            <View style={styles.metaIconWrap}>
              <Calendar size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.metaLabel}>Scheduled Date</Text>
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.metaItem}>
            <View style={styles.metaIconWrap}>
              <Clock size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.metaLabel}>Preferred Time Slot</Text>
              <Text style={styles.metaText}>{booking.preferredTime}</Text>
            </View>
          </View>

          <View style={styles.metaItem}>
            <View style={styles.metaIconWrap}>
              <MapPin size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>Service Address</Text>
              <Text style={styles.metaText}>{booking.location}</Text>
            </View>
          </View>
        </Card>

        {/* ── 4. Assigned Cooperative Worker Card ── */}
        {booking.worker ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Cooperative Artisan</Text>
            <TouchableOpacity
              style={styles.workerRow}
              onPress={() => router.push(`/worker/${booking.workerId}`)}
              accessibilityRole="button"
              accessibilityLabel={`View worker ${booking.worker.user.name}`}
            >
              <Avatar name={booking.worker.user.name} size={50} />
              <View style={styles.workerInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.workerName}>{booking.worker.user.name}</Text>
                  <ShieldCheck size={16} color="#059669" />
                </View>
                <StarRating rating={booking.worker.rating} size={13} />
                <Text style={styles.workerMeta}>
                  {booking.worker.experience} yrs experience · {booking.worker.totalRatings} completed reviews
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        ) : (
          <Card style={styles.unassignedCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Users size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.unassignedTitle}>No Worker Assigned Yet</Text>
                <Text style={styles.unassignedText}>
                  Your booking request has been submitted to the cooperative pool.
                </Text>
              </View>
            </View>
            {user?.role === "customer" && booking.status === "pending" && (
              <Button
                label="Find & Select Available Worker"
                onPress={() => router.push(`/booking/workers?bookingId=${booking.id}`)}
                fullWidth
                size="md"
                style={{ marginTop: Spacing.sm }}
              />
            )}
          </Card>
        )}

        {/* ── 5. Transparent Financial Price Breakdown & Payment Status ── */}
        <Card style={styles.financialCard}>
          <View style={styles.financialHeader}>
            <Text style={styles.sectionTitle}>Payment & Price Breakdown</Text>
            <View
              style={[
                styles.paymentStatusBadge,
                isPaid ? styles.paymentStatusPaid : styles.paymentStatusPending,
              ]}
            >
              {isPaid ? (
                <CheckCircle size={12} color="#065F46" />
              ) : (
                <Clock size={12} color="#9A3412" />
              )}
              <Text
                style={[
                  styles.paymentStatusText,
                  isPaid ? { color: "#065F46" } : { color: "#9A3412" },
                ]}
              >
                Payment: {paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Service Tariff (Snapshot)</Text>
            <Text style={styles.priceRowVal}>₹{serviceFee.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={styles.priceRowLabel}>Platform Booking Charge</Text>
              <ShieldCheck size={13} color="#059669" />
            </View>
            <Text style={styles.priceRowVal}>₹{bookingCharge.toFixed(2)}</Text>
          </View>

          <View style={[styles.priceRow, styles.priceTotalRow]}>
            <Text style={styles.priceTotalLabel}>Total Amount</Text>
            <Text style={styles.priceTotalVal}>₹{totalAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.paymentMethodCard}>
            <CreditCard size={16} color="#0284C7" />
            <Text style={styles.paymentMethodCardText}>
              Payment Method: Pay on Service Completion (Cash / UPI directly to professional).
            </Text>
          </View>
        </Card>

        {/* ── 6. Status-Appropriate Actions ── */}
        <View style={styles.actions}>
          {canBookAgain && (
            <Button
              label="Book This Service Again"
              leftIcon={<RotateCcw size={16} color="#FFFFFF" />}
              onPress={handleBookAgain}
              fullWidth
              size="lg"
              style={{ marginBottom: Spacing.md }}
            />
          )}

          {canReview && (
            <Button
              label="Leave a Review for Artisan"
              leftIcon={<Star size={16} color="#FFFFFF" />}
              onPress={() => router.push(`/rating/${booking.id}`)}
              fullWidth
              size="lg"
              style={{ marginBottom: Spacing.md }}
            />
          )}

          {canComplain && (
            <Button
              label="Raise a Grievance / Complaint"
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

  statusCard: {
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  emergencyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.emergencyLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.extraBold,
    color: Colors.emergency,
  },
  bookingId: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    marginLeft: "auto",
  },

  // Stepper
  stepperContainer: {
    marginTop: Spacing.sm,
    position: "relative",
  },
  stepperLineTrack: {
    position: "absolute",
    top: 13,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: "#E2E8F0",
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepperCol: {
    alignItems: "center",
    width: 60,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stepCircleDone: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  stepCircleCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCircleUnfinished: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  stepColText: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  stepColTextCurrent: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: Radius.md,
    gap: 8,
  },
  cancelledText: {
    fontSize: Typography.fontSize.xs,
    color: "#DC2626",
    fontWeight: Typography.fontWeight.semiBold,
  },

  // Section Cards
  section: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  serviceNameText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  serviceCategoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textTransform: "capitalize",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  descText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  notesBox: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  notesText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
  },

  // Meta
  metaItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginVertical: 4,
  },
  metaIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metaText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginTop: 1,
  },

  // Worker
  workerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  workerInfo: {
    flex: 1,
    gap: 3,
  },
  workerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  workerMeta: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  unassignedCard: {
    marginBottom: Spacing.md,
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  unassignedTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  unassignedText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Financial Price Breakdown Card
  financialCard: {
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  financialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  paymentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  paymentStatusPaid: {
    backgroundColor: "#D1FAE5",
  },
  paymentStatusPending: {
    backgroundColor: "#FFEDD5",
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  priceRowLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  priceRowVal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  priceTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    marginTop: 4,
  },
  priceTotalLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.extraBold,
    color: Colors.textPrimary,
  },
  priceTotalVal: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.extraBold,
    color: "#059669",
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 10,
    borderRadius: Radius.md,
    gap: 8,
    marginTop: 6,
  },
  paymentMethodCardText: {
    fontSize: 11,
    color: "#0369A1",
    flex: 1,
    lineHeight: 15,
  },

  actions: {
    marginTop: Spacing.sm,
  },
  notFound: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  notFoundText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
