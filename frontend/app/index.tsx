// ============================================================
// CoopConnect – Entry Index (Onboarding / Role Redirect)
// ============================================================

import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users, Briefcase, Shield, Star, CheckCircle, TrendingUp,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common/UIKit';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: <CheckCircle size={20} color={Colors.secondary} />, text: 'Verified & trusted workers' },
  { icon: <Star size={20} color={Colors.secondary} />, text: 'Rated & reviewed professionals' },
  { icon: <TrendingUp size={20} color={Colors.secondary} />, text: 'Fair work distribution' },
];

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.replace('/(admin)');
      } else if (user.role === 'worker') {
        router.replace('/(worker)');
      } else {
        router.replace('/(customer)');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) return <LoadingSpinner label="Loading Sevai One…" />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Users size={36} color={Colors.textInverse} />
            </View>
          </View>
          <Text style={styles.appName}>Sevai One</Text>
          <Text style={styles.tagline}>
            Connecting skilled workers with customers through Labour Cooperative Societies
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              {f.icon}
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Role Selection */}
        <Text style={styles.sectionTitle}>Sign in as</Text>

        <TouchableOpacity
          style={[styles.roleCard, styles.roleCardCustomer]}
          onPress={() => router.push('/(auth)/login?role=customer')}
          activeOpacity={0.85}
        >
          <View style={styles.roleIconWrap}>
            <Users size={26} color={Colors.primary} />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={styles.roleTitle}>Customer</Text>
            <Text style={styles.roleDesc}>Book skilled workers for home services</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, styles.roleCardWorker]}
          onPress={() => router.push('/(auth)/login?role=worker')}
          activeOpacity={0.85}
        >
          <View style={[styles.roleIconWrap, styles.roleIconGreen]}>
            <Briefcase size={26} color={Colors.secondary} />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={styles.roleTitle}>Worker</Text>
            <Text style={styles.roleDesc}>Manage jobs, earnings & your profile</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, styles.roleCardAdmin]}
          onPress={() => router.push('/(auth)/login?role=admin')}
          activeOpacity={0.85}
        >
          <View style={[styles.roleIconWrap, styles.roleIconDark]}>
            <Shield size={26} color={Colors.primaryDark} />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={styles.roleTitle}>Cooperative Admin</Text>
            <Text style={styles.roleDesc}>Verify workers, manage bookings & complaints</Text>
          </View>
        </TouchableOpacity>

        {/* Demo logins hint */}
        <View style={styles.demoHint}>
          <Text style={styles.demoTitle}>Demo Accounts</Text>
          <Text style={styles.demoLine}>Customer: customer@coopconnect.in</Text>
          <Text style={styles.demoLine}>Worker: worker@coopconnect.in</Text>
          <Text style={styles.demoLine}>Admin: admin@coopconnect.in</Text>
          <Text style={styles.demoLine}>Password: any 6+ characters</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  hero: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  logoWrap: { marginBottom: Spacing.sm },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  appName: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.extraBold,
    color: Colors.primaryDark,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width - 80,
  },
  featuresCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.md,
  },
  roleCardCustomer: { backgroundColor: Colors.cardBackground },
  roleCardWorker: { backgroundColor: Colors.cardBackground },
  roleCardAdmin: { backgroundColor: Colors.cardBackground },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconGreen: { backgroundColor: Colors.secondaryLight },
  roleIconDark: { backgroundColor: '#E8EDF5' },
  roleTextWrap: { flex: 1 },
  roleTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  demoHint: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.infoLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: 4,
  },
  demoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.info,
    marginBottom: 4,
  },
  demoLine: {
    fontSize: Typography.fontSize.xs,
    color: Colors.info,
    fontFamily: 'monospace',
  },
});
