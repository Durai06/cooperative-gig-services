// ============================================================
// CoopConnect – Matched Workers Screen
// Explainable rule-based matching with fair distribution metrics.
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Users, Star, ShieldCheck, MapPin, Award, CheckCircle,
  Scale, Info, ArrowRight,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants';
import { bookingService, workerService } from '@/services/api/bookingService';
import type { Booking, WorkerMatch } from '@/types';
import { Card, Avatar, StarRating, LoadingSpinner, Badge, EmptyState } from '@/components/common/UIKit';
import { Button } from '@/components/common/Button';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';

export default function BookingWorkersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [matches, setMatches] = useState<WorkerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<WorkerMatch | null>(null);
  const [assigning, setAssigning] = useState(false);

  const loadData = useCallback(async () => {
    if (!bookingId) return;
    try {
      const b = await bookingService.getBookingById(bookingId);
      if (b) {
        setBooking(b);
        const results = await workerService.matchWorkersForBooking({
          serviceId: b.serviceId,
          latitude: b.latitude,
          longitude: b.longitude,
        });
        setMatches(results);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load matching workers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectWorker = async (workerId: string) => {
    if (!bookingId) return;
    setAssigning(true);
    try {
      await bookingService.assignWorker(bookingId, workerId);
      Alert.alert(
        'Worker Assigned',
        'Worker has been assigned to this booking successfully.',
        [
          {
            text: 'View Booking',
            onPress: () => router.replace(`/booking/${bookingId}` as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Assignment Failed', err.message || 'Could not assign worker.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Matched Workers" showBack />
        <LoadingSpinner message="Calculating fair rule-based matches..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Matched Workers"
        subtitle={booking?.service?.name ?? 'Select Worker'}
        showBack
      />

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
        {/* Fair Distribution Banner */}
        <View style={styles.fairnessBanner}>
          <View style={styles.bannerIcon}>
            <Scale size={20} color={Colors.primary} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Cooperative Fair Distribution</Text>
            <Text style={styles.bannerDescription}>
              Rankings balance skill match (30%), proximity (25%), availability (20%), workload equity (10%), and experience (15%). No black-box AI.
            </Text>
          </View>
        </View>

        {matches.length === 0 ? (
          <EmptyState
            icon={<Users size={48} color={Colors.textDisabled} />}
            title="No Verified Workers Found"
            message="No verified cooperative workers currently match this service and location. Society administrators have been notified."
            actionLabel="Return to Booking"
            onAction={() => router.back()}
          />
        ) : (
          <View style={styles.list}>
            <Text style={styles.sectionHeader}>
              {matches.length} Eligible Worker{matches.length > 1 ? 's' : ''} Available
            </Text>

            {matches.map((item, idx) => {
              const { worker, score, breakdown, distanceKm } = item;
              const isSelected = selectedMatch?.worker.id === worker.id;

              return (
                <Card
                  key={worker.id}
                  style={[
                    styles.workerCard,
                    isSelected && styles.workerCardSelected,
                  ]}
                  onPress={() => setSelectedMatch(isSelected ? null : item)}
                >
                  <View style={styles.workerHeader}>
                    <Avatar
                      name={worker.user?.name ?? 'Worker'}
                      size={52}
                      backgroundColor={idx === 0 ? Colors.primary : Colors.surfaceSecondary}
                      textColor={idx === 0 ? Colors.surface : Colors.textPrimary}
                    />
                    <View style={styles.workerInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.workerName}>{worker.user?.name}</Text>
                        <ShieldCheck size={16} color={Colors.success} style={styles.verifiedIcon} />
                        {idx === 0 && (
                          <Badge label="Best Match" variant="success" size="sm" />
                        )}
                      </View>

                      <Text style={styles.coopName}>
                        {worker.cooperative?.name ?? 'Labour Cooperative'}
                      </Text>

                      <View style={styles.metaRow}>
                        <StarRating rating={worker.rating} size={13} showScore />
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.experienceText}>
                          {worker.experience} yrs exp
                        </Text>
                        {distanceKm !== undefined && (
                          <>
                            <Text style={styles.dot}>•</Text>
                            <MapPin size={12} color={Colors.textSecondary} />
                            <Text style={styles.distanceText}>{distanceKm} km</Text>
                          </>
                        )}
                      </View>
                    </View>

                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreNumber}>{Math.round(score)}</Text>
                      <Text style={styles.scoreLabel}>SCORE</Text>
                    </View>
                  </View>

                  {/* Skills badges */}
                  <View style={styles.skillsRow}>
                    {worker.skills.slice(0, 3).map((sk) => (
                      <View key={sk.id} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{sk.serviceName}</Text>
                      </View>
                    ))}
                    {worker.skills.length > 3 && (
                      <Text style={styles.moreSkills}>+{worker.skills.length - 3}</Text>
                    )}
                  </View>

                  {/* Score Breakdown toggle view */}
                  {isSelected && (
                    <View style={styles.breakdownBox}>
                      <Text style={styles.breakdownTitle}>Match Score Calculation</Text>

                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Skill Proficiency</Text>
                        <Text style={styles.breakdownVal}>+{breakdown.skillScore} pts</Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Proximity / Location</Text>
                        <Text style={styles.breakdownVal}>+{breakdown.proximityScore} pts</Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Experience & Ratings</Text>
                        <Text style={styles.breakdownVal}>
                          +{Math.round(breakdown.experienceScore + breakdown.ratingScore)} pts
                        </Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Fair Workload Rotation</Text>
                        <Text style={styles.breakdownVal}>+{breakdown.workloadScore} pts</Text>
                      </View>
                    </View>
                  )}

                  {/* Card Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.profileBtn}
                      onPress={() => router.push(`/worker/${worker.id}` as any)}
                    >
                      <Text style={styles.profileBtnText}>View Profile</Text>
                      <ArrowRight size={14} color={Colors.primary} />
                    </TouchableOpacity>

                    <Button
                      title="Select & Assign"
                      variant="primary"
                      size="sm"
                      loading={assigning && selectedMatch?.worker.id === worker.id}
                      onPress={() => handleSelectWorker(worker.id)}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  fairnessBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  bannerIcon: {
    marginRight: Spacing.sm,
    paddingTop: 2,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    ...Typography.subtitle2,
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  bannerDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  list: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    ...Typography.subtitle2,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  workerCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  workerCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  workerName: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  verifiedIcon: {
    marginRight: 2,
  },
  coopName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  dot: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  experienceText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  distanceText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  scoreContainer: {
    backgroundColor: Colors.primaryLight + '25',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    alignItems: 'center',
    minWidth: 50,
  },
  scoreNumber: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  moreSkills: {
    ...Typography.caption,
    color: Colors.textSecondary,
    alignSelf: 'center',
    fontSize: 11,
  },
  breakdownBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  breakdownTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  breakdownLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  breakdownVal: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  profileBtnText: {
    ...Typography.buttonSm,
    color: Colors.primary,
  },
});
