import { ResponsiveGrid } from "@/components/common/ResponsiveLayout";
import { BookingCard } from "@/components/cards/BookingCard";
import { MobileScreen } from "@/components/common/MobileScreen";
import { ServiceIcon } from "@/components/common/ServiceIcon";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/api/authService";
import { bookingService } from "@/services/api/bookingService";
import { catalogueService } from "@/services/api/otherServices";
import type { Booking, Service } from "@/types";
import { router, useFocusEffect } from "expo-router";
import {
  AlertCircle,
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  Edit2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CustomerHome() {
  const { user, updateUser } = useAuth();
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState(user?.address || "Bengaluru, Karnataka");
  const [savingLocation, setSavingLocation] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedServices, fetchedBookings] = await Promise.all([
        catalogueService.getServices(),
        user ? bookingService.getCustomerBookings(user.id).catch(() => []) : Promise.resolve([]),
      ]);
      setServicesList(fetchedServices);
      setBookings(fetchedBookings);
    } catch (err: any) {
      setError(err?.message || "Could not load marketplace data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handleSaveLocation = async () => {
    if (!locationInput.trim()) return;
    setSavingLocation(true);
    try {
      await authService.updateProfile({ address: locationInput.trim() });
      if (user && updateUser) {
        updateUser({ ...user, address: locationInput.trim() });
      }
      setShowLocationModal(false);
    } catch (err: any) {
      alert("Failed to update location: " + (err?.message || "Please try again"));
    } finally {
      setSavingLocation(false);
    }
  };

  // Next active booking
  const activeBookings = useMemo(() => {
    return bookings.filter((b) =>
      ["pending", "worker_assigned", "accepted", "in_progress"].includes(b.status)
    );
  }, [bookings]);

  const nextActiveBooking = activeBookings.length > 0 ? activeBookings[0] : null;

  // Recent completed or other bookings below hero
  const pastBookings = useMemo(() => {
    if (nextActiveBooking) {
      return bookings.filter((b) => b.id !== nextActiveBooking.id).slice(0, 3);
    }
    return bookings.slice(0, 3);
  }, [bookings, nextActiveBooking]);

  // Filtered services including domestic helper
  const filteredServices = useMemo(() => {
    if (!search.trim()) return servicesList;
    const q = search.toLowerCase();
    return servicesList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [servicesList, search]);

  const firstName = user?.name ? user.name.split(" ")[0] : "Friend";

  return (
    <MobileScreen
      brand
      right={
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push("/(customer)/notifications")}
          style={s.headerNotifBtn}
        >
          <Bell size={22} color="#FFFFFF" />
        </TouchableOpacity>
      }
    >
      {/* ── 1. Editable Location & Greeting Header ── */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.locationBar}
          onPress={() => {
            setLocationInput(user?.address || "Bengaluru, Karnataka");
            setShowLocationModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Change service address"
        >
          <View style={s.locationIconWrap}>
            <MapPin size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={s.locationTitle}>Service Address</Text>
              <Edit2 size={11} color={Colors.textSecondary} />
            </View>
            <Text style={s.locationSubtitle} numberOfLines={1}>
              {user?.address || "Add your delivery location"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Greeting Banner */}
      <View style={s.greetingContainer}>
        <Text style={s.greetingGreeting}>Namaste, {firstName}</Text>
        <Text style={s.greetingHeadline}>What service can we help you with today?</Text>
      </View>

      {/* ── 2. Prominent Search Bar (Zomato Style) ── */}
      <View style={s.searchContainer}>
        <Search size={20} color={Colors.primaryDark} />
        <TextInput
          accessibilityLabel="Search services"
          placeholder="Search electrician, plumber, domestic helper..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
          style={s.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            accessibilityLabel="Clear search"
            style={{ padding: 4 }}
          >
            <X size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── 3. Next Active Booking Highlight (Hero Card) ── */}
      {nextActiveBooking && (
        <View style={s.activeBookingHero}>
          <View style={s.heroTopRow}>
            <View style={s.heroLivePill}>
              <View style={s.heroPulseDot} />
              <Text style={s.heroLiveText}>UPCOMING BOOKING</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: "#E0F2FE" }]}>
              <Text style={s.statusBadgeText}>
                {nextActiveBooking.status.replace("_", " ").toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={s.heroBody}>
            <View style={s.heroServiceIconWrap}>
              <ServiceIcon
                category={nextActiveBooking.service?.category || "technician"}
                size={48}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroServiceName}>
                {nextActiveBooking.service?.name || "Service Professional"}
              </Text>
              <View style={s.heroScheduleRow}>
                <Calendar size={13} color={Colors.textSecondary} />
                <Text style={s.heroScheduleText}>{nextActiveBooking.preferredDate}</Text>
                <Clock size={13} color={Colors.textSecondary} style={{ marginLeft: 6 }} />
                <Text style={s.heroScheduleText}>{nextActiveBooking.preferredTime}</Text>
              </View>
              {nextActiveBooking.worker ? (
                <Text style={s.heroWorkerText}>
                  Assigned: {nextActiveBooking.worker.user.name}
                </Text>
              ) : (
                <Text style={s.heroPendingText}>Assigning verified local cooperative worker...</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={s.heroViewBtn}
            onPress={() => router.push(`/booking/${nextActiveBooking.id}`)}
            accessibilityRole="button"
            accessibilityLabel="View next active booking details"
          >
            <Text style={s.heroViewBtnText}>View Booking</Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── 4. Service Categories Grid (Includes Domestic Helper) ── */}
      <View style={s.sectionHeaderRow}>
        <Text style={s.sectionTitle}>
          {search ? `Matching Services (${filteredServices.length})` : "Service Categories"}
        </Text>
        {!search && (
          <TouchableOpacity onPress={() => router.push("/(customer)/services")}>
            <Text style={s.seeAllText}>Explore All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={s.centerText}>Loading Sevai One services...</Text>
        </View>
      ) : error ? (
        <View style={s.errorBox}>
          <AlertCircle size={28} color={Colors.error} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadData}>
            <RefreshCw size={14} color="#FFFFFF" />
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredServices.length > 0 ? (
        <ResponsiveGrid minItemWidth={96} maxColumns={5} gap={12}>
          {filteredServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={s.serviceCard}
              onPress={() => router.push(`/service/${service.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${service.name}, From ₹${service.basePrice}`}
              activeOpacity={0.8}
            >
              <ServiceIcon category={service.category} size={50} />
              <Text style={s.serviceCardTitle} numberOfLines={2}>
                {service.name}
              </Text>
              <Text style={s.serviceCardPrice}>From ₹{service.basePrice}</Text>
            </TouchableOpacity>
          ))}
        </ResponsiveGrid>
      ) : (
        <View style={s.emptyResultsBox}>
          <Search size={28} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>No matching services found</Text>
          <Text style={s.emptySubtitle}>
            {'Try searching for "Domestic Helper", "Plumber", or "Electrician"'}
          </Text>
        </View>
      )}

      {/* ── 5. Cooperative Fair Assurance Banner ── */}
      <View style={s.assuranceCard}>
        <View style={s.assuranceIconWrap}>
          <ShieldCheck size={24} color="#059669" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.assuranceTitle}>Sevai One Cooperative Guarantee</Text>
          <Text style={s.assuranceSubtitle}>
            100% verified neighbourhood professionals. Regulated fair pricing with transparent ₹100 platform fee.
          </Text>
        </View>
      </View>

      {/* ── 6. Recent Bookings ── */}
      <View style={[s.sectionHeaderRow, { marginTop: Spacing.xl }]}>
        <Text style={s.sectionTitle}>Recent Bookings</Text>
        {bookings.length > 0 && (
          <TouchableOpacity onPress={() => router.push("/(customer)/bookings")}>
            <Text style={s.seeAllText}>All Bookings</Text>
          </TouchableOpacity>
        )}
      </View>

      {pastBookings.length > 0 ? (
        <ResponsiveGrid minItemWidth={300} maxColumns={2} gap={12}>
          {pastBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              compact
              onPress={() => router.push(`/booking/${b.id}`)}
            />
          ))}
        </ResponsiveGrid>
      ) : !loading && (
        <View style={s.noBookingsCard}>
          <Text style={s.noBookingsTitle}>No recent bookings yet</Text>
          <Text style={s.noBookingsText}>
            Select any service category above to book your verified local professional.
          </Text>
        </View>
      )}

      {/* ── Location Edit Modal ── */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={s.modalTitle}>Update Service Location</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={s.modalLabel}>Enter your street address or landmark</Text>
            <TextInput
              style={s.modalInput}
              value={locationInput}
              onChangeText={setLocationInput}
              placeholder="e.g. 12, MG Road, Bengaluru"
              placeholderTextColor="#94A3B8"
              autoFocus
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setShowLocationModal(false)}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalSaveBtn}
                onPress={handleSaveLocation}
                disabled={savingLocation}
              >
                {savingLocation ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.modalSaveText}>Save Location</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </MobileScreen>
  );
}

const s = StyleSheet.create({
  headerNotifBtn: {
    padding: 8,
    borderRadius: Radius.full,
  },
  topBar: {
    marginBottom: Spacing.sm,
  },
  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  locationIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  locationTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  locationSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  greetingContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  greetingGreeting: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  greetingHeadline: {
    fontSize: 22,
    fontWeight: Typography.fontWeight.extraBold,
    color: Colors.textPrimary,
    lineHeight: 28,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    marginBottom: Spacing.lg,
    ...Shadows.sm,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  activeBookingHero: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: "#0874FF",
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  heroLivePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#059669",
  },
  heroLiveText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: "#059669",
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  heroBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  heroServiceIconWrap: {
    padding: 2,
  },
  heroServiceName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  heroScheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  heroScheduleText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  heroWorkerText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primaryDark,
    marginTop: 4,
  },
  heroPendingText: {
    fontSize: Typography.fontSize.xs,
    color: "#D97706",
    fontStyle: "italic",
    marginTop: 4,
  },
  heroViewBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: Radius.lg,
    gap: 6,
  },
  heroViewBtnText: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  serviceCardTitle: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginTop: 8,
    minHeight: 30,
  },
  serviceCardPrice: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.semiBold,
    marginTop: 2,
  },
  assuranceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: Radius.lg,
    padding: 14,
    gap: 12,
    marginTop: Spacing.lg,
  },
  assuranceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  assuranceTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: "#065F46",
  },
  assuranceSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: "#047857",
    marginTop: 2,
    lineHeight: 16,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  centerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: Spacing.base,
    borderRadius: Radius.lg,
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    textAlign: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 6,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyResultsBox: {
    padding: 30,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  noBookingsCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  noBookingsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  noBookingsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  modalLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: Radius.md,
    padding: 12,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  modalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  modalSaveText: {
    fontSize: Typography.fontSize.sm,
    color: "#FFFFFF",
    fontWeight: Typography.fontWeight.bold,
  },
});
