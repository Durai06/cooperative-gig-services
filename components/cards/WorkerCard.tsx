// ============================================================
// CoopConnect – Worker Card Component
// ============================================================

import { Avatar, Badge, StarRating } from "@/components/common/UIKit";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import type { Worker, WorkerMatch } from "@/types";
import {
  Briefcase,
  CheckCircle,
  Clock,
  MapPin,
  XCircle,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Worker List Card ────────────────────────────────────────

interface WorkerCardProps {
  worker: Worker;
  onPress: () => void;
  match?: WorkerMatch;
}

export function WorkerCard({ worker, onPress, match }: WorkerCardProps) {
  const vColor = {
    verified: Colors.success,
    pending: Colors.warning,
    rejected: Colors.error,
  }[worker.verificationStatus];

  const vIcon = {
    verified: (
      <CheckCircle size={13} color={Colors.success} fill={Colors.success} />
    ),
    pending: <Clock size={13} color={Colors.warning} />,
    rejected: <XCircle size={13} color={Colors.error} />,
  }[worker.verificationStatus];

  const vLabel = {
    verified: "Verified",
    pending: "Pending",
    rejected: "Rejected",
  }[worker.verificationStatus];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        <Avatar name={worker.user.name} size={52} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {worker.user.name}
            </Text>
            <View
              style={[
                styles.verificationBadge,
                { backgroundColor: `${vColor}18` },
              ]}
            >
              {vIcon}
              <Text style={[styles.verificationText, { color: vColor }]}>
                {vLabel}
              </Text>
            </View>
          </View>

          <View style={styles.skillsRow}>
            {worker.skills.slice(0, 2).map((s) => (
              <Badge key={s.id} label={s.serviceName} variant="primary" small />
            ))}
            {worker.skills.length > 2 && (
              <Badge
                label={`+${worker.skills.length - 2}`}
                variant="neutral"
                small
              />
            )}
          </View>

          <View style={styles.metaRow}>
            <StarRating rating={worker.rating} size={12} showNumber />
            <View style={styles.metaItem}>
              <Briefcase size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{worker.experience}y exp</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {worker.location.split(",")[0]}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Match score */}
      {match && (
        <View style={styles.matchRow}>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: `${match.score}%` }]} />
          </View>
          <Text style={styles.scoreText}>{match.score}% match</Text>
          {match.distanceKm !== undefined && (
            <Text style={styles.distanceText}>{match.distanceKm} km away</Text>
          )}
        </View>
      )}

      {/* Availability */}
      <View style={styles.availRow}>
        <View
          style={[
            styles.availDot,
            {
              backgroundColor: worker.availability
                ? Colors.success
                : Colors.error,
            },
          ]}
        />
        <Text
          style={[
            styles.availText,
            { color: worker.availability ? Colors.success : Colors.error },
          ]}
        >
          {worker.availability ? "Available" : "Unavailable"}
        </Text>
        <Text style={styles.jobsText}>
          {worker.activeJobs} active · {worker.completedJobs} done
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Compact Worker Row ──────────────────────────────────────

interface WorkerRowProps {
  worker: Worker;
  onPress?: () => void;
  right?: React.ReactNode;
}

export function WorkerRow({ worker, onPress, right }: WorkerRowProps) {
  return (
    <TouchableOpacity
      style={styles.rowContainer}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <Avatar name={worker.user.name} size={40} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {worker.user.name}
        </Text>
        <Text style={styles.rowSubtext} numberOfLines={1}>
          {worker.skills.map((s) => s.serviceName).join(", ")}
        </Text>
      </View>
      {right}
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
    gap: Spacing.sm,
  },
  row: { flexDirection: "row", gap: Spacing.md, alignItems: "flex-start" },
  info: { flex: 1, gap: 6 },
  nameRow: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.xs,
  },
  name: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  verificationText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.semiBold,
  },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scoreBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  scoreText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.secondary,
    minWidth: 60,
    textAlign: "right",
  },
  distanceText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  availRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  availText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  jobsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: "auto",
  },
  // Row styles
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  rowInfo: { flex: 1 },
  rowName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  rowSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
