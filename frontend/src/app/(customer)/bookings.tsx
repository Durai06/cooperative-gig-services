import {
  ResponsiveGrid,
  PageFrame,
} from "@/components/common/ResponsiveLayout";
// ============================================================
// Sevai One – Customer Bookings Screen
// ============================================================

import { BookingCard } from "@/components/cards/BookingCard";
import { Button } from "@/components/common/Button";
import { EmptyState, LoadingSpinner } from "@/components/common/UIKit";
import { Colors, Radius, Spacing, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/api/bookingService";
import type { Booking, BookingStatus } from "@/types";
import { useRouter, useFocusEffect } from "expo-router";
import { CalendarX, Plus } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Tab = "all" | "active" | "completed" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const ACTIVE_STATUSES: BookingStatus[] = [
  "pending",
  "worker_assigned",
  "accepted",
  "in_progress",
];

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const loadBookings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await bookingService.getCustomerBookings(user.id);
      setBookings(data);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
    }, [loadBookings]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return ACTIVE_STATUSES.includes(b.status);
    if (activeTab === "completed") return b.status === "completed";
    return b.status === "cancelled";
  });

  if (loading) return <LoadingSpinner label="Loading bookings…" />;

  return (
    <PageFrame edges={["top", "left", "right"]} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push("/booking/create")}
        >
          <Plus size={18} color={Colors.textInverse} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: Colors.error, padding: 16 }}
        >
          {error}
        </Text>
      )}
      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === t.key && styles.tabTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {filteredBookings.length === 0 ? (
          <EmptyState
            icon={<CalendarX size={32} color={Colors.textMuted} />}
            title="No bookings here"
            subtitle={
              activeTab === "active"
                ? "Book a service to get started."
                : `Your ${activeTab} bookings will appear here.`
            }
            action={
              activeTab === "active" && (
                <Button
                  label="Book a Service"
                  onPress={() => router.push("/booking/create")}
                />
              )
            }
          />
        ) : (
          <ResponsiveGrid minItemWidth={340} maxColumns={2}>
            {filteredBookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onPress={() => router.push(`/booking/${b.id}`)}
              />
            ))}
          </ResponsiveGrid>
        )}
      </ScrollView>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.extraBold,
    color: Colors.textPrimary,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  newBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.semiBold,
  },
  tabs: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: { color: Colors.textInverse },
  scroll: { padding: Spacing.base, paddingTop: 0, paddingBottom: Spacing.xxxl },
});
