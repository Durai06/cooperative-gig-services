import {
  ResponsiveGrid,
  PageFrame,
} from "@/components/common/ResponsiveLayout";
import { Alert } from "@/components/common/Feedback";
import { useFocusEffect, useRouter } from "expo-router";
// ============================================================
// Sevai One – Worker Verification & Roster Management
// Review trade credentials, approve memberships, and manage workers.
// ============================================================

import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  LoadingSpinner,
} from "@/components/common/UIKit";
import { Colors, Radius, Spacing, Typography } from "@/constants";
import { workerService } from "@/services/api/bookingService";
import type { Worker } from "@/types";
import { ArrowRight, MapPin, Search, Users } from "lucide-react-native";
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

type FilterTab = "all" | "pending" | "verified" | "rejected";

export default function AdminWorkersScreen() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await workerService.getAllWorkers();
      setWorkers(data);
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

  const handleVerify = async (
    workerId: string,
    status: "verified" | "rejected",
  ) => {
    const actionLabel = status === "verified" ? "Approve" : "Reject";
    Alert.alert(
      `${actionLabel} Membership`,
      `Are you sure you want to ${status === "verified" ? "grant official cooperative verification to" : "reject"} this worker?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionLabel,
          style: status === "rejected" ? "destructive" : "default",
          onPress: async () => {
            setProcessingId(workerId);
            try {
              await workerService.updateVerificationStatus(workerId, status);
              Alert.alert(
                "Status Updated",
                `Worker has been marked as ${status}.`,
              );
              loadData();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Could not update status.");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const filtered = workers.filter((w) => {
    const matchesTab =
      activeTab === "all" || w.verificationStatus === activeTab;
    const nameMatch = (w.user?.name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const skillMatch = w.skills.some((s) =>
      s.serviceName.toLowerCase().includes(search.toLowerCase()),
    );
    return matchesTab && (nameMatch || skillMatch);
  });

  const pendingCount = workers.filter(
    (w) => w.verificationStatus === "pending",
  ).length;

  return (
    <PageFrame edges={["top", "left", "right"]} style={styles.safe}>
      <ScreenHeader title="Manage Workers" />

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Search
          size={18}
          color={Colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search worker by name or skill..."
          placeholderTextColor={Colors.textDisabled}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {(["pending", "verified", "all", "rejected"] as FilterTab[]).map(
          (tab) => {
            const isActive = activeTab === tab;
            const label =
              tab === "pending"
                ? `Pending (${pendingCount})`
                : tab === "verified"
                  ? "Verified"
                  : tab === "rejected"
                    ? "Rejected"
                    : "All Roster";
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          },
        )}
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
          <LoadingSpinner message="Loading worker roster..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={48} color={Colors.textDisabled} />}
            title="No Workers Found"
            message={`There are currently no workers in the '${activeTab}' category matching your search.`}
          />
        ) : (
          <ResponsiveGrid minItemWidth={340} maxColumns={2}>
            {filtered.map((w) => (
              <Card key={w.id} style={styles.workerCard}>
                <View style={styles.workerTop}>
                  <Avatar
                    name={w.user?.name ?? "Worker"}
                    size={48}
                    backgroundColor={Colors.primary}
                    textColor={Colors.surface}
                  />
                  <View style={styles.workerInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.workerName}>{w.user?.name}</Text>
                      <Badge
                        label={w.verificationStatus.toUpperCase()}
                        variant={
                          w.verificationStatus === "verified"
                            ? "success"
                            : w.verificationStatus === "pending"
                              ? "warning"
                              : "danger"
                        }
                        size="sm"
                      />
                    </View>
                    <Text style={styles.workerMeta}>
                      <MapPin size={12} color={Colors.textSecondary} />{" "}
                      {w.location} • {w.experience} yrs exp
                    </Text>
                    <Text style={styles.workerContact}>
                      Phone: {w.user?.phone}
                    </Text>
                  </View>
                </View>

                {/* Skills */}
                <View style={styles.skillsRow}>
                  {w.skills.map((s) => (
                    <View key={s.id} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{s.serviceName}</Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.profileLink}
                    onPress={() =>
                      router.push(
                        `/(admin)/verification?workerId=${w.id}` as any,
                      )
                    }
                  >
                    <Text style={styles.profileLinkText}>View Profile</Text>
                    <ArrowRight size={14} color={Colors.primary} />
                  </TouchableOpacity>

                  {w.verificationStatus === "pending" && (
                    <View style={styles.verifyBtnGroup}>
                      <Button
                        title="Reject"
                        variant="outline"
                        size="sm"
                        loading={processingId === w.id}
                        onPress={() => handleVerify(w.id, "rejected")}
                        style={{ marginRight: Spacing.xs }}
                      />
                      <Button
                        title="Approve Member"
                        variant="primary"
                        size="sm"
                        loading={processingId === w.id}
                        onPress={() => handleVerify(w.id, "verified")}
                      />
                    </View>
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
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    gap: 6,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
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
  },
  tabTextActive: {
    color: Colors.surface,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  workerCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  workerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  workerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workerName: {
    flexShrink: 1,
    minWidth: 0,
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  workerMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  workerContact: {
    flexShrink: 1,
    minWidth: 0,
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  skillChip: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.round,
  },
  skillChipText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  actionRow: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  profileLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profileLinkText: {
    ...Typography.buttonSm,
    color: Colors.primary,
  },
  verifyBtnGroup: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
});
