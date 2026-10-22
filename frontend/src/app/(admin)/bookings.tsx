import {
  ResponsiveGrid,
  PageFrame,
} from "@/components/common/ResponsiveLayout";
import { useFocusEffect, useRouter } from "expo-router";
// ============================================================
// Sevai One – Administrator Booking Oversight & Dispatch
// Monitor all society bookings, manual worker assignment & emergency queue.
// ============================================================

import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import {
  Badge,
  Card,
  EmptyState,
  LoadingSpinner,
} from "@/components/common/UIKit";
import {
  BOOKING_STATUS_LABELS,
  Colors,
  Radius,
  Spacing,
  Typography,
} from "@/constants";
import { bookingService } from "@/services/api/bookingService";
import type { Booking } from "@/types";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  MapPin,
  Search,
  UserCheck,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type StatusFilter = "all" | "pending" | "active" | "completed" | "cancelled";

export default function AdminBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      const data = await bookingService.getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const filtered = bookings.filter((b) => {
    let matchesStatus = true;
    if (filter === "pending") {
      matchesStatus = b.status === "pending" || b.status === "worker_assigned";
    } else if (filter === "active") {
      matchesStatus = b.status === "accepted" || b.status === "in_progress";
    } else if (filter === "completed") {
      matchesStatus = b.status === "completed";
    } else if (filter === "cancelled") {
      matchesStatus = b.status === "cancelled";
    }

    const searchLower = search.toLowerCase();
    const serviceMatch = (b.service?.name ?? "")
      .toLowerCase()
      .includes(searchLower);
    const customerMatch = (b.customer?.name ?? "")
      .toLowerCase()
      .includes(searchLower);
    const workerMatch = (b.worker?.user?.name ?? "")
      .toLowerCase()
      .includes(searchLower);

    return matchesStatus && (serviceMatch || customerMatch || workerMatch);
  });

  const pendingUnassignedCount = bookings.filter(
    (b) => b.status === "pending",
  ).length;

  return (
    <PageFrame edges={["top", "left", "right"]} style={styles.safe}>
      <ScreenHeader title="Booking Management" />

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Search
          size={18}
          color={Colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer, worker, or service..."
          placeholderTextColor={Colors.textDisabled}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Row */}
      <View style={styles.tabRow}>
        {(
          [
            "all",
            "pending",
            "active",
            "completed",
            "cancelled",
          ] as StatusFilter[]
        ).map((tab) => {
          const isActive = filter === tab;
          const label =
            tab === "pending"
              ? `Unassigned (${pendingUnassignedCount})`
              : tab === "active"
                ? "In Progress"
                : tab === "completed"
                  ? "Completed"
                  : tab === "cancelled"
                    ? "Cancelled"
                    : "All Bookings";
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setFilter(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {loading ? (
          <LoadingSpinner message="Loading society bookings..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={48} color={Colors.textDisabled} />}
            title="No Bookings Found"
            message="No bookings match the selected status filter."
          />
        ) : (
          <ResponsiveGrid minItemWidth={340} maxColumns={2}>
            {filtered.map((b) => (
              <Card key={b.id} style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.serviceCol}>
                    <Text style={styles.serviceName}>{b.service?.name}</Text>
                    <Text style={styles.customerName}>
                      Customer: {b.customer?.name}
                    </Text>
                  </View>
                  <View style={styles.badgeCol}>
                    {b.emergency && (
                      <Badge label="EMERGENCY" variant="danger" size="sm" />
                    )}
                    <Badge
                      label={BOOKING_STATUS_LABELS[b.status]}
                      variant={
                        b.status === "completed"
                          ? "success"
                          : b.status === "cancelled"
                            ? "neutral"
                            : b.status === "in_progress"
                              ? "warning"
                              : "primary"
                      }
                      size="sm"
                    />
                  </View>
                </View>

                <View style={styles.metaBox}>
                  <View style={styles.metaRow}>
                    <Clock size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {format(new Date(b.preferredDate), "EEE, dd MMM yyyy")} at{" "}
                      {b.preferredTime}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <MapPin size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{b.location}</Text>
                  </View>
                </View>

                {/* Worker Assignment Status */}
                <View style={styles.workerStatusRow}>
                  {b.worker ? (
                    <View style={styles.assignedWorker}>
                      <UserCheck size={16} color={Colors.success} />
                      <Text style={styles.assignedText}>
                        Assigned:{" "}
                        <Text style={{ fontWeight: "700" }}>
                          {b.worker.user?.name}
                        </Text>
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.unassignedNotice}>
                      <AlertTriangle size={16} color={Colors.warningDark} />
                      <Text style={styles.unassignedText}>
                        No worker assigned yet
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <Button
                    title="View Details"
                    variant="outline"
                    size="sm"
                    onPress={() => router.push(`/booking/${b.id}` as any)}
                  />

                  {b.status === "pending" && (
                    <Button
                      title="Find & Assign Worker"
                      variant="primary"
                      size="sm"
                      onPress={() =>
                        router.push(`/booking/workers?bookingId=${b.id}` as any)
                      }
                    />
                  )}
                </View>
              </Card>
            ))}
          </ResponsiveGrid>
        )}
      </ScrollView>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceSecondary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 42,
    ...Typography.body2,
    color: Colors.textPrimary,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    gap: 6,
    flexWrap: "wrap",
  },
  tabBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSecondary,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 11,
  },
  tabTextActive: {
    color: Colors.surface,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  bookingCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  serviceCol: {
    flex: 1,
  },
  serviceName: {
    flexShrink: 1,
    minWidth: 0,
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  customerName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  metaBox: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    flexShrink: 1,
    minWidth: 0,
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  workerStatusRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  assignedWorker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  assignedText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  unassignedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unassignedText: {
    ...Typography.caption,
    color: Colors.warningDark,
    fontWeight: "600",
  },
  actionRow: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
});
