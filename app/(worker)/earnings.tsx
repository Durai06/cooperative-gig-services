// ============================================================
// CoopConnect – Worker Earnings & Cooperative Payouts Screen
// Transparent earnings, welfare deduction, and payout history.
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  IndianRupee, TrendingUp, ShieldCheck, HeartHandshake,
  Download, ArrowUpRight, CheckCircle2, Clock, Landmark,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants';
import { Card, Badge, Divider } from '@/components/common/UIKit';
import { Button } from '@/components/common/Button';
import { ScreenHeader } from '@/components/common/ScreenHeader';

interface Transaction {
  id: string;
  bookingRef: string;
  service: string;
  date: string;
  grossAmount: number;
  coopFee: number;
  netAmount: number;
  status: 'credited' | 'processing';
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    bookingRef: 'BKG-7821',
    service: 'Full Electrical Rewiring',
    date: '2025-03-24T14:30:00Z',
    grossAmount: 1800,
    coopFee: 90,
    netAmount: 1710,
    status: 'credited',
  },
  {
    id: 'tx-2',
    bookingRef: 'BKG-7790',
    service: 'Switchboard & Inverter Repair',
    date: '2025-03-22T10:15:00Z',
    grossAmount: 650,
    coopFee: 32,
    netAmount: 618,
    status: 'credited',
  },
  {
    id: 'tx-3',
    bookingRef: 'BKG-7712',
    service: 'Emergency Short Circuit Fix',
    date: '2025-03-20T19:45:00Z',
    grossAmount: 850,
    coopFee: 42,
    netAmount: 808,
    status: 'credited',
  },
  {
    id: 'tx-4',
    bookingRef: 'BKG-7650',
    service: 'Ceiling Fan Installation (2 Units)',
    date: '2025-03-18T11:00:00Z',
    grossAmount: 500,
    coopFee: 25,
    netAmount: 475,
    status: 'credited',
  },
];

export default function WorkerEarningsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const totalGross = MOCK_TRANSACTIONS.reduce((acc, t) => acc + t.grossAmount, 0);
  const totalCoopFund = MOCK_TRANSACTIONS.reduce((acc, t) => acc + t.coopFee, 0);
  const totalNet = MOCK_TRANSACTIONS.reduce((acc, t) => acc + t.netAmount, 0);

  const handleWithdrawalRequest = () => {
    Alert.alert(
      'Cooperative Payout',
      `Submit request to transfer ₹${totalNet} to your linked cooperative bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Payout',
          onPress: () => {
            setRequesting(true);
            setTimeout(() => {
              setRequesting(false);
              Alert.alert('Payout Processed', 'Funds transferred directly to your account. Reference: COOP-NEFT-9912.');
            }, 800);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="My Earnings" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 500);
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Main Earnings Card */}
        <Card style={styles.earningsHero}>
          <Text style={styles.heroSub}>Total Net Disbursed</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.heroAmount}>{totalNet.toLocaleString('en-IN')}</Text>
          </View>
          <Text style={styles.heroPeriod}>This Month • 4 Completed Bookings</Text>

          <View style={styles.heroDivider} />

          <View style={styles.metricsTriple}>
            <View style={styles.metricCol}>
              <Text style={styles.metricVal}>₹{totalGross}</Text>
              <Text style={styles.metricSub}>Gross Billings</Text>
            </View>
            <View style={styles.vertLine} />
            <View style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: Colors.primary }]}>₹{totalCoopFund}</Text>
              <Text style={styles.metricSub}>Welfare Fund (5%)</Text>
            </View>
            <View style={styles.vertLine} />
            <View style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: Colors.success }]}>95%</Text>
              <Text style={styles.metricSub}>Take-Home Rate</Text>
            </View>
          </View>
        </Card>

        {/* Cooperative Advantage Notice */}
        <View style={styles.coopAdvantageBox}>
          <HeartHandshake size={22} color={Colors.primary} style={styles.advIcon} />
          <View style={styles.advContent}>
            <Text style={styles.advTitle}>Cooperative Fair Share Model</Text>
            <Text style={styles.advText}>
              Unlike commercial corporate apps that take 25%–35% of your hard-earned wages, your Labour Cooperative Society retains only a modest 5% contribution toward worker healthcare, death benefit insurance, and collective bargaining.
            </Text>
          </View>
        </View>

        {/* Bank & Settlement Details */}
        <Card style={styles.bankCard}>
          <View style={styles.bankHeader}>
            <Landmark size={20} color={Colors.primary} />
            <View style={styles.bankInfo}>
              <Text style={styles.bankName}>State Bank of India</Text>
              <Text style={styles.bankAccount}>A/C: •••• •••• 4492 (Primary Direct Transfer)</Text>
            </View>
            <Badge label="Verified" variant="success" size="sm" />
          </View>

          <Button
            title="Request Instant Bank Settlement"
            variant="outline"
            size="sm"
            loading={requesting}
            onPress={handleWithdrawalRequest}
            style={styles.payoutBtn}
          />
        </Card>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Job Earning Statements</Text>
        <Card style={styles.txCard}>
          {MOCK_TRANSACTIONS.map((tx, idx) => (
            <View key={tx.id}>
              <View style={styles.txRow}>
                <View style={styles.txLeft}>
                  <Text style={styles.txService}>{tx.service}</Text>
                  <Text style={styles.txRef}>
                    {tx.bookingRef} • {format(new Date(tx.date), 'dd MMM yyyy')}
                  </Text>
                  <Text style={styles.txBreakdown}>
                    Gross: ₹{tx.grossAmount} − Coop: ₹{tx.coopFee}
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txNet}>+₹{tx.netAmount}</Text>
                  <Badge label="Credited" variant="success" size="sm" />
                </View>
              </View>
              {idx < MOCK_TRANSACTIONS.length - 1 && <Divider style={styles.txDivider} />}
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
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  earningsHero: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  currencySymbol: {
    ...Typography.h3,
    color: Colors.primary,
    fontWeight: '700',
    marginRight: 4,
  },
  heroAmount: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  heroPeriod: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  metricsTriple: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    ...Typography.subtitle1,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  metricSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  vertLine: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  coopAdvantageBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight + '20',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  advIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  advContent: {
    flex: 1,
  },
  advTitle: {
    ...Typography.subtitle2,
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  advText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  bankCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  bankName: {
    ...Typography.subtitle2,
    color: Colors.textPrimary,
  },
  bankAccount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  payoutBtn: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  txCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  txLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  txService: {
    ...Typography.subtitle2,
    color: Colors.textPrimary,
  },
  txRef: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txBreakdown: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txNet: {
    ...Typography.subtitle1,
    color: Colors.success,
    fontWeight: '700',
  },
  txDivider: {
    marginVertical: Spacing.sm,
  },
});
