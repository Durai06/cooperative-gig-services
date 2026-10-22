// ============================================================
// CoopConnect – Administrator Overview Dashboard
// Society operational metrics, verification queue, and alerts.
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Building2, Users, CalendarCheck, AlertTriangle, Star,
  ShieldAlert, ShieldCheck, ArrowRight, TrendingUp, LogOut,
  Clock, CheckCircle2, ChevronRight, Activity,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { workerService, bookingService } from '@/services/api/bookingService';
import { complaintService, analyticsService } from '@/services/api/otherServices';
import type { Worker, Booking, Complaint, AnalyticsSummary } from '@/types';
import { Card, Avatar, Badge, LoadingSpinner, Divider } from '@/components/common/UIKit';
import { Button } from '@/components/common/Button';
import { RoleSwitcherButton } from '@/components/common/RoleSwitcher';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [w, b, c, s] = await Promise.all([
        workerService.getAllWorkers(),
        bookingService.getAllBookings(),
        complaintService.getAllComplaints(),
        analyticsService.getSummary(),
      ]);
      setWorkers(w);
      setBookings(b);
      setComplaints(c);
      setSummary(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
        router.replace('/roles');
      } catch (err) {
        console.error('Logout error:', err);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Sign out of administrator session?')) {
        await doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Sign out of administrator session?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingSpinner message="Loading cooperative control center..." />
      </SafeAreaView>
    );
  }

  const pendingWorkers = workers.filter((w) => w.verificationStatus === 'pending');
  const openComplaints = complaints.filter((c) => c.status === 'open');
  const activeBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'worker_assigned' || b.status === 'in_progress'
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerSub}>Society Administrator</Text>
          <Text style={styles.headerName}>{user?.name ?? 'Admin'}</Text>
          <View style={styles.coopRow}>
            <Building2 size={13} color={Colors.primary} />
            <Text style={styles.coopName}>Bengaluru Labour Cooperative Society</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <RoleSwitcherButton />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
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
        {/* Urgent Action Alerts */}
        {pendingWorkers.length > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push('/(admin)/workers' as any)}
            activeOpacity={0.8}
          >
            <ShieldAlert size={20} color={Colors.warningDark} />
            <View style={styles.alertTextWrap}>
              <Text style={styles.alertTitle}>
                {pendingWorkers.length} Worker Verification{pendingWorkers.length > 1 ? 's' : ''} Pending
              </Text>
              <Text style={styles.alertSub}>Review credentials & issue society approval.</Text>
            </View>
            <ArrowRight size={16} color={Colors.warningDark} />
          </TouchableOpacity>
        )}

        {openComplaints.length > 0 && (
          <TouchableOpacity
            style={[styles.alertBanner, styles.alertBannerError]}
            onPress={() => router.push('/(admin)/complaints' as any)}
            activeOpacity={0.8}
          >
            <AlertTriangle size={20} color={Colors.error} />
            <View style={styles.alertTextWrap}>
              <Text style={[styles.alertTitle, { color: Colors.errorDark }]}>
                {openComplaints.length} Open Customer Grievance{openComplaints.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.alertSub}>Society arbitration required within 24 hours.</Text>
            </View>
            <ArrowRight size={16} color={Colors.error} />
          </TouchableOpacity>
        )}

        {/* Executive KPI Grid */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Users size={18} color={Colors.primary} />
              <Badge label={`${workers.length} Total`} variant="primary" size="sm" />
            </View>
            <Text style={styles.kpiValue}>{workers.filter((w) => w.verificationStatus === 'verified').length}</Text>
            <Text style={styles.kpiLabel}>Verified Workers</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <CalendarCheck size={18} color={Colors.primary} />
              <Badge label={`${bookings.length} All`} variant="neutral" size="sm" />
            </View>
            <Text style={styles.kpiValue}>{activeBookings.length}</Text>
            <Text style={styles.kpiLabel}>Active Bookings</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <AlertTriangle size={18} color={openComplaints.length > 0 ? Colors.error : Colors.success} />
              <Badge
                label={openComplaints.length > 0 ? 'Urgent' : 'Clear'}
                variant={openComplaints.length > 0 ? 'danger' : 'success'}
                size="sm"
              />
            </View>
            <Text style={[styles.kpiValue, openComplaints.length > 0 && { color: Colors.error }]}>
              {openComplaints.length}
            </Text>
            <Text style={styles.kpiLabel}>Open Complaints</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Star size={18} color={Colors.warning} />
              <Badge label="Avg" variant="warning" size="sm" />
            </View>
            <Text style={styles.kpiValue}>{summary?.averageRating.toFixed(1) ?? '4.8'}</Text>
            <Text style={styles.kpiLabel}>Customer Satisfaction</Text>
          </Card>
        </View>

        {/* Quick Operations Nav */}
        <Text style={styles.sectionTitle}>Operations</Text>
        <Card style={styles.opsCard}>
          <TouchableOpacity
            style={styles.opsItem}
            onPress={() => router.push('/(admin)/workers' as any)}
          >
            <View style={styles.opsIcon}>
              <Users size={20} color={Colors.primary} />
            </View>
            <View style={styles.opsTextCol}>
              <Text style={styles.opsTitle}>Worker Verification & Roster</Text>
              <Text style={styles.opsSub}>Manage certified tradespeople and review applications</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Divider />

          <TouchableOpacity
            style={styles.opsItem}
            onPress={() => router.push('/(admin)/bookings' as any)}
          >
            <View style={styles.opsIcon}>
              <CalendarCheck size={20} color={Colors.primary} />
            </View>
            <View style={styles.opsTextCol}>
              <Text style={styles.opsTitle}>Booking Dispatch & Oversight</Text>
              <Text style={styles.opsSub}>Override assignments, handle emergencies & monitor status</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Divider />

          <TouchableOpacity
            style={styles.opsItem}
            onPress={() => router.push('/(admin)/complaints' as any)}
          >
            <View style={styles.opsIcon}>
              <ShieldAlert size={20} color={Colors.primary} />
            </View>
            <View style={styles.opsTextCol}>
              <Text style={styles.opsTitle}>Grievance Mediation Center</Text>
              <Text style={styles.opsSub}>Arbitrate customer disputes with documented resolutions</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Divider />

          <TouchableOpacity
            style={styles.opsItem}
            onPress={() => router.push('/(admin)/analytics' as any)}
          >
            <View style={styles.opsIcon}>
              <TrendingUp size={20} color={Colors.primary} />
            </View>
            <View style={styles.opsTextCol}>
              <Text style={styles.opsTitle}>Fairness & Demand Analytics</Text>
              <Text style={styles.opsSub}>Workload rotation equity and trade revenue breakdown</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Live Society Activity Feed */}
        <Text style={styles.sectionTitle}>Recent Society Activity</Text>
        <Card style={styles.activityCard}>
          {bookings.slice(0, 4).map((b, idx) => (
            <View key={b.id}>
              <View style={styles.actItem}>
                <View style={styles.actDot} />
                <View style={styles.actContent}>
                  <Text style={styles.actTitle}>
                    {b.service?.name} booked by {b.customer?.name}
                  </Text>
                  <Text style={styles.actMeta}>
                    Status: {b.status.toUpperCase()} • {format(new Date(b.createdAt), 'dd MMM, HH:mm')}
                  </Text>
                </View>
                <Badge
                  label={b.emergency ? 'Emergency' : b.status}
                  variant={b.emergency ? 'danger' : b.status === 'completed' ? 'success' : 'primary'}
                  size="sm"
                />
              </View>
              {idx < 3 && <Divider style={{ marginVertical: 6 }} />}
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerName: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  coopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  coopName: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontWeight: '600',
    fontSize: 11,
  },
  logoutBtn: {
    padding: Spacing.sm,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight + '25',
    borderWidth: 1,
    borderColor: Colors.warning + '40',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  alertBannerError: {
    backgroundColor: Colors.errorLight + '20',
    borderColor: Colors.error + '40',
  },
  alertTextWrap: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  alertTitle: {
    ...Typography.subtitle2,
    color: Colors.warningDark,
  },
  alertSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  kpiCard: {
    width: '48%',
    padding: Spacing.md,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  kpiValue: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  kpiLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  opsCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  opsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  opsIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  opsTextCol: {
    flex: 1,
  },
  opsTitle: {
    ...Typography.subtitle2,
    color: Colors.textPrimary,
  },
  opsSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activityCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  actDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  actContent: {
    flex: 1,
  },
  actTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
});
