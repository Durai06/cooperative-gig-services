import { Alert } from "@/components/common/Feedback";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
// ============================================================
// CoopConnect – Worker Profile Detail Screen
// Detailed view of a worker, cooperative affiliation & reviews.
// ============================================================

import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import {
  Avatar,
  Badge,
  Card,
  Divider,
  EmptyState,
  LoadingSpinner,
  StarRating,
} from "@/components/common/UIKit";
import { Colors, Radius, Spacing, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { workerService } from "@/services/api/bookingService";
import { ratingService } from "@/services/api/otherServices";
import type { Rating, Worker } from "@/types";
import { format } from "date-fns";
import {
  Award,
  Building,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PageFrame } from "@/components/common/ResponsiveLayout";

export default function WorkerProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const w = await workerService.getWorkerById(id);
      if (w) {
        setWorker(w);
        const r = await ratingService.getWorkerRatings(id);
        setReviews(r);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load worker profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  if (loading) {
    return (
      <PageFrame maxWidth={900} style={styles.safe}>
        <ScreenHeader title="Worker Profile" showBack />
        <LoadingSpinner message="Loading worker credentials..." />
      </PageFrame>
    );
  }

  if (!worker) {
    return (
      <PageFrame maxWidth={900} style={styles.safe}>
        <ScreenHeader title="Worker Profile" showBack />
        <EmptyState
          icon={<ShieldCheck size={48} color={Colors.textDisabled} />}
          title="Worker Not Found"
          message="Could not find the requested worker profile."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame maxWidth={900} style={styles.safe}>
      <ScreenHeader title="Worker Profile" showBack />

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
        {/* Worker Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.avatarRow}>
            <Avatar
              name={worker.user?.name ?? "Worker"}
              size={72}
              backgroundColor={Colors.primary}
              textColor={Colors.surface}
            />
            <View style={styles.avatarDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{worker.user?.name}</Text>
                {worker.verificationStatus === "verified" && (
                  <ShieldCheck size={20} color={Colors.success} />
                )}
              </View>

              <Text style={styles.locationText}>
                <MapPin size={13} color={Colors.textSecondary} />{" "}
                {worker.location}
              </Text>

              <View style={styles.badgeRow}>
                <Badge
                  label={
                    worker.verificationStatus === "verified"
                      ? "Society Verified"
                      : worker.verificationStatus === "pending"
                        ? "Verification Pending"
                        : "Unverified"
                  }
                  variant={
                    worker.verificationStatus === "verified"
                      ? "success"
                      : "warning"
                  }
                  size="sm"
                />
                <Badge
                  label={
                    worker.availability ? "Available Now" : "Currently Busy"
                  }
                  variant={worker.availability ? "primary" : "neutral"}
                  size="sm"
                />
              </View>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>★ {worker.rating.toFixed(1)}</Text>
              <Text style={styles.metricLbl}>
                {worker.totalRatings} Reviews
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{worker.experience} yrs</Text>
              <Text style={styles.metricLbl}>Experience</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{worker.completedJobs}</Text>
              <Text style={styles.metricLbl}>Jobs Done</Text>
            </View>
          </View>
        </Card>

        {/* Cooperative Society Affiliation Card */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Building size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Labour Cooperative Society</Text>
          </View>
          <Text style={styles.coopName}>
            {worker.cooperative?.name ?? "Bengaluru Labour Cooperative"}
          </Text>
          <Text style={styles.coopDetail}>
            Location: {worker.cooperative?.location ?? "Bengaluru"}
          </Text>
          <Text style={styles.coopDetail}>
            Society Contact: {worker.cooperative?.contact ?? "+91 80 4567 8901"}
          </Text>
          <View style={styles.coopGuarantee}>
            <CheckCircle2 size={16} color={Colors.success} />
            <Text style={styles.guaranteeText}>
              Backed by cooperative dispute resolution & fair wage standards.
            </Text>
          </View>
        </Card>

        {/* Verified Skills */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Award size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Verified Skills & Trade</Text>
          </View>
          <View style={styles.skillList}>
            {worker.skills.map((skill) => (
              <View key={skill.id} style={styles.skillTag}>
                <CheckCircle2 size={14} color={Colors.primary} />
                <Text style={styles.skillTagText}>{skill.serviceName}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Reviews & Ratings */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Star size={18} color={Colors.warning} />
            <Text style={styles.sectionTitle}>
              Reviews & Ratings ({reviews.length})
            </Text>
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>
              No customer reviews recorded yet.
            </Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewItem}>
                <View style={styles.reviewTop}>
                  <StarRating rating={rev.overall} size={14} showScore />
                  <Text style={styles.reviewDate}>
                    {format(new Date(rev.createdAt), "dd MMM yyyy")}
                  </Text>
                </View>

                {/* Sub-criterion Breakdown */}
                <View style={styles.subCriteriaRow}>
                  <Text style={styles.subCriteria}>
                    Quality: {rev.workQuality}/5
                  </Text>
                  <Text style={styles.subCriteria}>
                    Punctuality: {rev.punctuality}/5
                  </Text>
                  <Text style={styles.subCriteria}>
                    Professional: {rev.professionalism}/5
                  </Text>
                </View>

                {rev.review ? (
                  <Text style={styles.reviewText}>
                    &quot;{rev.review}&quot;
                  </Text>
                ) : null}
                <Divider style={styles.reviewDivider} />
              </View>
            ))
          )}
        </Card>

        {/* Action Button for Customers */}
        {user?.role === "customer" && (
          <Button
            title="Book with this Worker"
            variant="primary"
            size="lg"
            style={styles.bookBtn}
            onPress={() => router.push("/booking/create" as any)}
          />
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
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  locationText: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  metricsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  metricItem: {
    alignItems: "center",
  },
  metricVal: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  metricLbl: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  coopName: {
    ...Typography.subtitle2,
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  coopDetail: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  coopGuarantee: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: Colors.successLight + "25",
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  guaranteeText: {
    ...Typography.caption,
    color: Colors.successDark,
    flex: 1,
  },
  skillList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight + "25",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.round,
  },
  skillTagText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.primaryDark,
  },
  noReviews: {
    ...Typography.body2,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  reviewItem: {
    marginTop: Spacing.sm,
  },
  reviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  subCriteriaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  subCriteria: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  reviewText: {
    ...Typography.body2,
    color: Colors.textPrimary,
    marginTop: 4,
    lineHeight: 20,
  },
  reviewDivider: {
    marginTop: Spacing.sm,
  },
  bookBtn: {
    marginTop: Spacing.sm,
  },
});
