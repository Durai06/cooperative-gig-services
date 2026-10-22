// ============================================================
// CoopConnect – Worker Profile & Cooperative Affiliation Screen
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ShieldCheck, User, Phone, Mail, MapPin, Award,
  Building, LogOut, ChevronRight, FileText, HeartHandshake,
  CheckCircle2, AlertTriangle,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { workerService } from '@/services/api/bookingService';
import type { Worker } from '@/types';
import { Card, Avatar, Badge, StarRating, Divider, LoadingSpinner } from '@/components/common/UIKit';


export default function WorkerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const w = await workerService.getWorkerByUserId(user.id);
        if (w) setWorker(w);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

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
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out?')) {
        await doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of your worker account?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingSpinner message="Loading worker profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Worker Profile</Text>

        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <Avatar
              name={user?.name ?? 'Worker'}
              size={64}
              backgroundColor={Colors.primary}
              textColor={Colors.surface}
            />
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user?.name}</Text>
                {worker?.verificationStatus === 'verified' && (
                  <ShieldCheck size={18} color={Colors.success} />
                )}
              </View>
              <Text style={styles.userPhone}>{user?.phone}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.badgeWrap}>
                <Badge
                  label={
                    worker?.verificationStatus === 'verified'
                      ? 'Verified Society Member'
                      : 'Pending Society Verification'
                  }
                  variant={worker?.verificationStatus === 'verified' ? 'success' : 'warning'}
                  size="sm"
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Cooperative Membership Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Building size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Cooperative Society Details</Text>
          </View>

          <View style={styles.coopDetailRow}>
            <Text style={styles.coopLabel}>Society:</Text>
            <Text style={styles.coopVal}>{worker?.cooperative?.name ?? 'Bengaluru Labour Cooperative'}</Text>
          </View>
          <View style={styles.coopDetailRow}>
            <Text style={styles.coopLabel}>Member ID:</Text>
            <Text style={styles.coopVal}>BLC-2025-0891</Text>
          </View>
          <View style={styles.coopDetailRow}>
            <Text style={styles.coopLabel}>Society Helpline:</Text>
            <Text style={styles.coopVal}>{worker?.cooperative?.contact ?? '+91 80 4567 8901'}</Text>
          </View>
          <View style={styles.coopDetailRow}>
            <Text style={styles.coopLabel}>Location:</Text>
            <Text style={styles.coopVal}>{worker?.cooperative?.location ?? 'Bengaluru, KA'}</Text>
          </View>
        </Card>

        {/* Verified Trades & Skills */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Award size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Registered Skills ({worker?.skills.length ?? 0})</Text>
          </View>

          <View style={styles.skillsCloud}>
            {worker?.skills.map((s) => (
              <View key={s.id} style={styles.skillBadge}>
                <CheckCircle2 size={13} color={Colors.primary} />
                <Text style={styles.skillText}>{s.serviceName}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Society Welfare Program */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <HeartHandshake size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Cooperative Welfare & Benefits</Text>
          </View>

          <View style={styles.benefitItem}>
            <CheckCircle2 size={16} color={Colors.success} />
            <Text style={styles.benefitText}>Group Health & Accidental Insurance (Active)</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle2 size={16} color={Colors.success} />
            <Text style={styles.benefitText}>Mutual Aid & Emergency Advance Fund</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle2 size={16} color={Colors.success} />
            <Text style={styles.benefitText}>Annual Trade Tool Upgrade Subsidy</Text>
          </View>
        </Card>



        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out from Cooperative</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Sevai One Mobile v1.0.0 (Expo SDK 53)</Text>
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
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  userCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  userPhone: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  badgeWrap: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  sectionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  coopDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  coopLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  coopVal: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  skillsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight + '25',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.round,
  },
  skillText: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  benefitText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight + '20',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  logoutText: {
    ...Typography.button,
    color: Colors.error,
  },
  versionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
