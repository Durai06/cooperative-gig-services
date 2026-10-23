import { ResponsiveGrid } from "@/components/common/ResponsiveLayout";
import { ServiceIcon } from "@/components/common/ServiceIcon";
import { MobileScreen } from "@/components/common/MobileScreen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import { catalogueService } from "@/services/api/otherServices";
import { workerService } from "@/services/api/bookingService";
import type { Service, Worker } from "@/types";
import { router } from "expo-router";
import {
  AlertCircle,
  ArrowUpDown,
  BadgeCheck,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Services() {
  const [search, setSearch] = useState("");
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [workersList, setWorkersList] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">("featured");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [services, workers] = await Promise.all([
        catalogueService.getServices(),
        workerService.getAllWorkers().catch(() => []),
      ]);
      setServicesList(services);
      setWorkersList(workers);
    } catch (err: any) {
      setError(err?.message || "Failed to load services. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Compute stats per category/service from workers
  const serviceStats = useMemo(() => {
    const map = new Map<string, { verifiedCount: number; availableCount: number; avgRating: number; totalReviews: number }>();

    for (const svc of servicesList) {
      const matchingWorkers = workersList.filter((w) =>
        w.skills.some((sk) => sk.serviceId === svc.id || sk.serviceName.toLowerCase() === svc.name.toLowerCase())
      );
      const verified = matchingWorkers.filter((w) => w.verificationStatus === "verified").length;
      const available = matchingWorkers.filter((w) => w.availability).length;
      
      const workersWithReviews = matchingWorkers.filter((w) => w.totalRatings > 0);
      let avgRating = 0;
      let totalReviews = 0;
      if (workersWithReviews.length > 0) {
        totalReviews = workersWithReviews.reduce((sum, w) => sum + w.totalRatings, 0);
        const weightedScore = workersWithReviews.reduce((sum, w) => sum + w.rating * w.totalRatings, 0);
        avgRating = totalReviews > 0 ? Number((weightedScore / totalReviews).toFixed(1)) : 0;
      }

      map.set(svc.id, {
        verifiedCount: verified,
        availableCount: available,
        avgRating,
        totalReviews,
      });
    }
    return map;
  }, [servicesList, workersList]);

  // Unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(servicesList.map((s) => s.category)));
    return ["all", ...cats];
  }, [servicesList]);

  // Filtered & Sorted services
  const filteredServices = useMemo(() => {
    let result = servicesList.filter((x) => {
      const matchesSearch = `${x.name} ${x.description} ${x.category}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCat = selectedCategory === "all" || x.category === selectedCategory;
      if (!matchesSearch || !matchesCat) return false;

      if (verifiedOnly) {
        const stats = serviceStats.get(x.id);
        if (!stats || stats.verifiedCount === 0) return false;
      }
      return true;
    });

    if (sortBy === "price_asc") {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.basePrice - a.basePrice);
    }

    return result;
  }, [servicesList, search, selectedCategory, sortBy, verifiedOnly, serviceStats]);

  const BOOKING_CHARGE = 100;

  return (
    <MobileScreen title="Services Marketplace">
      {/* Search Input */}
      <View style={s.searchRow}>
        <Search size={18} color={Colors.textSecondary} />
        <TextInput
          accessibilityLabel="Search services"
          placeholder="Search by service name, type, or work..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={s.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} accessibilityLabel="Clear search input">
            <X size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.categoryPillsContainer}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const displayLabel = cat === "all" ? "All Services" : cat.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <TouchableOpacity
              key={cat}
              style={[s.categoryPill, isSelected && s.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${displayLabel}`}
            >
              <Text style={[s.categoryPillText, isSelected && s.categoryPillTextActive]}>
                {displayLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Secondary Filter & Sort Bar */}
      <View style={s.filterSortBar}>
        <TouchableOpacity
          style={[s.sortPill, verifiedOnly && s.sortPillActive]}
          onPress={() => setVerifiedOnly(!verifiedOnly)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: verifiedOnly }}
        >
          <ShieldCheck size={14} color={verifiedOnly ? "#FFFFFF" : Colors.secondary} />
          <Text style={[s.sortPillText, verifiedOnly && s.sortPillTextActive]}>
            Verified Artisans Only
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.sortPill}
          onPress={() => {
            if (sortBy === "featured") setSortBy("price_asc");
            else if (sortBy === "price_asc") setSortBy("price_desc");
            else setSortBy("featured");
          }}
          accessibilityRole="button"
          accessibilityLabel={`Sort: currently ${sortBy}`}
        >
          <ArrowUpDown size={14} color={Colors.textSecondary} />
          <Text style={s.sortPillText}>
            {sortBy === "featured"
              ? "Sort: Featured"
              : sortBy === "price_asc"
                ? "Price: Low to High"
                : "Price: High to Low"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={s.centerSubtext}>Loading Sevai One verified services...</Text>
        </View>
      ) : error ? (
        <View style={s.errorBox}>
          <AlertCircle size={28} color={Colors.error} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadData}>
            <RefreshCw size={14} color="#FFFFFF" />
            <Text style={s.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ResponsiveGrid minItemWidth={310} maxColumns={3} gap={14}>
          {filteredServices.map((svc) => {
            const stats = serviceStats.get(svc.id);
            const verifiedWorkers = stats?.verifiedCount ?? 0;
            const availableWorkers = stats?.availableCount ?? 0;
            const totalWithCharge = svc.basePrice + BOOKING_CHARGE;

            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${svc.name}, ₹${svc.basePrice} plus ₹100 platform fee`}
                key={svc.id}
                style={s.serviceCard}
                onPress={() => router.push(`/service/${svc.id}`)}
                activeOpacity={0.8}
              >
                <View style={s.cardTopRow}>
                  {/* Distinct category icon */}
                  <ServiceIcon category={svc.category} size={54} />

                  <View style={{ flex: 1 }}>
                    <View style={s.cardTitleRow}>
                      <Text style={s.serviceTitle}>{svc.name}</Text>
                      {stats && stats.totalReviews > 0 && stats.avgRating > 0 && (
                        <View style={s.ratingBadge}>
                          <Star size={12} color="#D97706" fill="#D97706" />
                          <Text style={s.ratingText}>
                            {stats.avgRating} ({stats.totalReviews})
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.serviceDescription} numberOfLines={2}>
                      {svc.description}
                    </Text>
                  </View>
                </View>

                {/* Cooperative Verification & Availability Badge */}
                <View style={s.availabilityRow}>
                  <View style={s.workerCountTag}>
                    <BadgeCheck size={14} color="#059669" />
                    <Text style={s.workerCountText}>
                      {verifiedWorkers > 0
                        ? `${verifiedWorkers} verified in cooperative`
                        : "Cooperative certified"}
                    </Text>
                  </View>
                  {availableWorkers > 0 && (
                    <View style={s.liveTag}>
                      <View style={s.liveDot} />
                      <Text style={s.liveText}>{availableWorkers} Available Today</Text>
                    </View>
                  )}
                </View>

                {/* Transparent Price Breakdown */}
                <View style={s.pricingBox}>
                  <View style={s.pricingRow}>
                    <Text style={s.priceBreakdownLabel}>Service tariff:</Text>
                    <Text style={s.priceBreakdownVal}>₹{svc.basePrice}</Text>
                  </View>
                  <View style={s.pricingRow}>
                    <Text style={s.priceBreakdownLabel}>Platform booking fee:</Text>
                    <Text style={s.priceBreakdownVal}>₹{BOOKING_CHARGE}</Text>
                  </View>
                  <View style={[s.pricingRow, s.pricingTotalRow]}>
                    <Text style={s.pricingTotalLabel}>Estimated Total:</Text>
                    <Text style={s.pricingTotalVal}>₹{totalWithCharge}</Text>
                  </View>
                </View>

                {/* Book Action Button */}
                <View style={s.bookBtn}>
                  <Text style={s.bookBtnText}>Book Professional</Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ResponsiveGrid>
      )}

      {!loading && !error && filteredServices.length === 0 && (
        <View style={s.emptyBox}>
          <Search size={32} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>No matching services found</Text>
          <Text style={s.emptySubtitle}>
            {'Try clearing your search or switching to "All Services".'}
          </Text>
          <TouchableOpacity
            style={s.clearBtn}
            onPress={() => {
              setSearch("");
              setSelectedCategory("all");
              setVerifiedOnly(false);
            }}
          >
            <Text style={s.clearBtnText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </MobileScreen>
  );
}

const s = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    marginBottom: Spacing.md,
    gap: 10,
    height: 48,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  categoryPillsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
  },
  filterSortBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
  },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  sortPillActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  sortPillTextActive: {
    color: "#FFFFFF",
    fontWeight: Typography.fontWeight.bold,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  serviceTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: "#B45309",
  },
  serviceDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    gap: 6,
  },
  workerCountTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  workerCountText: {
    fontSize: 11,
    color: "#065F46",
    fontWeight: Typography.fontWeight.medium,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  liveText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: "#16A34A",
  },
  pricingBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    gap: 4,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceBreakdownLabel: {
    fontSize: 11,
    color: "#166534",
  },
  priceBreakdownVal: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.semiBold,
    color: "#166534",
  },
  pricingTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#BBF7D0",
    paddingTop: 4,
    marginTop: 2,
  },
  pricingTotalLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: "#14532D",
  },
  pricingTotalVal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.extraBold,
    color: "#14532D",
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    gap: 6,
  },
  bookBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: "#FFFFFF",
  },
  centerBox: {
    paddingVertical: 50,
    alignItems: "center",
    gap: 12,
  },
  centerSubtext: {
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
    marginVertical: Spacing.md,
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
  emptyBox: {
    padding: 40,
    alignItems: "center",
    gap: 10,
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
  clearBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
  },
  clearBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
});
