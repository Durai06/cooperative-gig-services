// ============================================================
// CoopConnect – Worker Dashboard Screen (My Jobs)
// Real-time job requests, availability switch, and active tasks.
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Briefcase, CheckCircle2, Clock, MapPin, Zap, AlertCircle,
  Play, CheckCircle, XCircle, Phone, ArrowRight, ShieldCheck,
} from 'lucide-react-native';
import { format } from 'date-fns';
import {
  Colors, Spacing, Typography, Radius, Shadows,
  BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS,
} from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService, workerService } from '@/services/api/bookingService';
import type { Booking, Worker } from '@/types';
import { Card, Avatar, Badge, LoadingSpinner, EmptyState, Divider } from '@/components/common/UIKit';
import { Button } from '@/components/common/Button';
import { RoleSwitcherButton } from '@/components/common/RoleSwitcher';

export default function WorkerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const w = await workerService.getWorkerByUserId(user.id);
      if (w) {
        setWorker(w);
        const b = await bookingService.getWorkerBookings(w.id);
        setBookings(b);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleAvailability = async () => {
    if (!worker) return;
    setUpdatingAvailability(true);
    try {
      const updated = await workerService.toggleAvailability(worker.id);
      setWorker({ ...updated });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update status');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleAcceptJob = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      await bookingService.updateBookingStatus(bookingId, 'accepted');
      Alert.alert('Job Accepted', 'Customer has been notified of your acceptance.');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not accept job.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleStartJob = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      await bookingService.updateBookingStatus(bookingId, 'in_progress');
      Alert.alert('Job Started', 'Work is marked in progress.');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update job.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteJob = async (bookingId: string) => {
    Alert.alert(
      'Complete Job',
      'Are you sure you have finished this work according to society standards?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Completed',
          onPress: async () => {
            setProcessingId(bookingId);
            try {
              await bookingService.updateBookingStatus(bookingId, 'completed');
              Alert.alert('Great Job!', 'Work marked completed. Earnings credited to your cooperative balance.');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not complete job.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingSpinner message="Loading worker dashboard..." />
      </SafeAreaView>
    );
  }

  const incomingRequests = bookings.filter((b) => b.status === 'worker_assigned');
  const activeJobs = bookings.filter((b) => b.status === 'accepted' || b.status === 'in_progress');
  const completedJobs = bookings.filter((b) => b.status === 'completed');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.workerIdentity}>
          <Text style={styles.greeting}>Namaste,</Text>
          <Text style={styles.workerName}>{user?.name ?? 'Worker'}</Text>
          <View style={styles.coopBadgeRow}>
            <ShieldCheck size={14} color={Colors.primary} />
            <Text style={styles.coopBadgeText}>
              {worker?.cooperative?.name ?? 'Labour Cooperative'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <RoleSwitcherButton />
          <View style={styles.availabilityToggle}>
            <Text style={[styles.onlineStatusText, worker?.availability ? styles.online : styles.offline]}>
              {worker?.availability ? 'ONLINE' : 'OFFLINE'}
            </Text>
            <Switch
              value={worker?.availability ?? false}
              onValueChange={handleToggleAvailability}
              disabled={updatingAvailability}
              trackColor={{ false: Colors.border, true: Colors.success }}
              thumbColor={Colors.surface}
            />
          </View>
        </View>
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
        {/* Offline Warning banner */}
        {!worker?.availability && (
          <View style={styles.offlineBanner}>
            <AlertCircle size={18} color={Colors.warningDark} />
            <Text style={styles.offlineBannerText}>
              You are currently marked OFFLINE. Switch online above to receive new job allocations from the society.
            </Text>
          </View>
        )}

        {/* KPI Summary Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiVal}>{incomingRequests.length}</Text>
            <Text style={styles.kpiLbl}>New Requests</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiVal}>{activeJobs.length}</Text>
            <Text style={styles.kpiLbl}>In Progress</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiVal}>{completedJobs.length}</Text>
            <Text style={styles.kpiLbl}>Completed</Text>
          </View>
        </View>

        {/* ─── SECTION 1: INCOMING REQUESTS ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>New Job Requests</Text>
            {incomingRequests.length > 0 && (
              <Badge label={`${incomingRequests.length} Pending`} variant="warning" size="sm" />
            )}
          </View>

          {incomingRequests.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No pending requests right now.</Text>
            </Card>
          ) : (
            incomingRequests.map((b) => (
              <Card key={b.id} style={styles.requestCard}>
                <View style={styles.requestTop}>
                  <View style={styles.requestServiceCol}>
                    <Text style={styles.requestService}>{b.service?.name}</Text>
                    <Text style={styles.requestCustomer}>Customer: {b.customer?.name}</Text>
                  </View>
                  {b.emergency && (
                    <Badge label="EMERGENCY" variant="danger" size="sm" />
                  )}
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.reqDetailRow}>
                    <Clock size={14} color={Colors.textSecondary} />
                    <Text style={styles.reqDetailText}>
                      {format(new Date(b.preferredDate), 'EEE, dd MMM')} at {b.preferredTime}
                    </Text>
                  </View>
                  <View style={styles.reqDetailRow}>
                    <MapPin size={14} color={Colors.textSecondary} />
                    <Text style={styles.reqDetailText}>{b.location}</Text>
                  </View>
                  {b.description ? (
                    <Text style={styles.reqProblemDesc}>&ldquo;{b.description}&rdquo;</Text>
                  ) : null}
                </View>

                <View style={styles.requestActions}>
                  <Button
                    title="Accept Job"
                    variant="primary"
                    size="sm"
                    loading={processingId === b.id}
                    onPress={() => handleAcceptJob(b.id)}
                    style={{ flex: 1, marginRight: Spacing.sm }}
                  />
                  <Button
                    title="View Details"
                    variant="outline"
                    size="sm"
                    onPress={() => router.push(`/booking/${b.id}` as any)}
                  />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* ─── SECTION 2: ACTIVE & IN-PROGRESS WORK ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Jobs</Text>

          {activeJobs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No active jobs in progress.</Text>
            </Card>
          ) : (
            activeJobs.map((b) => (
              <Card key={b.id} style={styles.activeJobCard}>
                <View style={styles.activeJobHeader}>
                  <View>
                    <Text style={styles.activeJobTitle}>{b.service?.name}</Text>
                    <Text style={styles.activeCustomerName}>{b.customer?.name}</Text>
                  </View>
                  <Badge
                    label={BOOKING_STATUS_LABELS[b.status]}
                    variant={b.status === 'in_progress' ? 'warning' : 'primary'}
                    size="sm"
                  />
                </View>

                <View style={styles.activeJobInfo}>
                  <View style={styles.reqDetailRow}>
                    <MapPin size={14} color={Colors.textSecondary} />
                    <Text style={styles.reqDetailText}>{b.location}</Text>
                  </View>
                  <View style={styles.reqDetailRow}>
                    <Clock size={14} color={Colors.textSecondary} />
                    <Text style={styles.reqDetailText}>Scheduled: {b.preferredTime}</Text>
                  </View>
                </View>

                <Divider style={{ marginVertical: Spacing.sm }} />

                <View style={styles.activeJobActions}>
                  {b.status === 'accepted' && (
                    <Button
                      title="Start Work"
                      variant="primary"
                      size="sm"
                      loading={processingId === b.id}
                      onPress={() => handleStartJob(b.id)}
                      style={{ flex: 1, marginRight: Spacing.sm }}
                    />
                  )}
                  {b.status === 'in_progress' && (
                    <Button
                      title="Mark as Completed"
                      variant="success"
                      size="sm"
                      loading={processingId === b.id}
                      onPress={() => handleCompleteJob(b.id)}
                      style={{ flex: 1, marginRight: Spacing.sm }}
                    />
                  )}
                  <Button
                    title="Details"
                    variant="outline"
                    size="sm"
                    onPress={() => router.push(`/booking/${b.id}` as any)}
                  />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* ─── SECTION 3: RECENT COMPLETED JOBS ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Completed ({completedJobs.length})</Text>
          {completedJobs.slice(0, 3).map((b) => (
            <Card key={b.id} style={styles.completedCard}>
              <View style={styles.completedRow}>
                <View>
                  <Text style={styles.completedService}>{b.service?.name}</Text>
                  <Text style={styles.completedDate}>
                    {format(new Date(b.updatedAt), 'dd MMM yyyy, HH:mm')}
                  </Text>
                </View>
                <Badge label="Completed" variant="success" size="sm" />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  workerIdentity: {
    flex: 1,
  },
  greeting: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  workerName: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  coopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  coopBadgeText: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontWeight: '600',
    fontSize: 11,
  },
  availabilityToggle: {
    alignItems: 'center',
  },
  onlineStatusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  online: {
    color: Colors.success,
  },
  offline: {
    color: Colors.textDisabled,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warningLight + '25',
    borderWidth: 1,
    borderColor: Colors.warning + '40',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  offlineBannerText: {
    ...Typography.caption,
    color: Colors.warningDark,
    flex: 1,
    lineHeight: 18,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiVal: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
  kpiLbl: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyCardText: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  requestCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderColor: Colors.primaryLight,
  },
  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestServiceCol: {
    flex: 1,
  },
  requestService: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  requestCustomer: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  requestDetails: {
    marginVertical: Spacing.sm,
    gap: 4,
  },
  reqDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqDetailText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  reqProblemDesc: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    marginTop: 4,
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.xs,
    borderRadius: Radius.xs,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  activeJobCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  activeJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activeJobTitle: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  activeCustomerName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeJobInfo: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  activeJobActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedCard: {
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedService: {
    ...Typography.subtitle2,
    color: Colors.textPrimary,
  },
  completedDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
});
