// ============================================================
// CoopConnect – Customer Home Screen
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search, Bell, Zap, ChevronRight, MapPin,
  Zap as ZapIcon,
} from 'lucide-react-native';
import * as Icons from 'lucide-react-native';
import { format } from 'date-fns';
import { Colors, Spacing, Typography, Radius, Shadows, SERVICE_CATEGORIES, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/api/bookingService';
import { notificationService } from '@/services/api/otherServices';
import type { Booking, AppNotification } from '@/types';
import { Card, SectionHeader, Avatar, LoadingSpinner, Badge } from '@/components/common/UIKit';
import { BookingCard } from '@/components/cards/BookingCard';
import { RoleSwitcherButton } from '@/components/common/RoleSwitcher';

const { width } = Dimensions.get('window');
const CARD_W = (width - Spacing.base * 2 - Spacing.md) / 2;

function ServiceCategoryCard({ cat, onPress }: { cat: typeof SERVICE_CATEGORIES[number]; onPress: () => void }) {
  const IconComp = (Icons as any)[cat.icon.charAt(0).toUpperCase() + cat.icon.slice(1)] ?? Icons.Wrench;
  return (
    <TouchableOpacity style={[styles.serviceCard, { width: CARD_W }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.serviceIcon}>
        <IconComp size={22} color={Colors.primary} />
      </View>
      <Text style={styles.serviceName} numberOfLines={1}>{cat.name}</Text>
      <Text style={styles.serviceDesc} numberOfLines={2}>{cat.description}</Text>
    </TouchableOpacity>
  );
}

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [bkgs, notifs] = await Promise.all([
        bookingService.getCustomerBookings(user.id),
        notificationService.getUserNotifications(user.id),
      ]);
      setBookings(bkgs);
      setNotifications(notifs);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const activeBookings = bookings.filter((b) =>
    ['pending', 'worker_assigned', 'accepted', 'in_progress'].includes(b.status),
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredCategories = SERVICE_CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  if (loading) return <LoadingSpinner label="Loading…" />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName} numberOfLines={1}>{user?.name?.split(' ')[0] ?? 'Guest'} 👋</Text>
          </View>
          <View style={styles.topActions}>
            <RoleSwitcherButton />
            <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(customer)/notifications')}>
              <Bell size={22} color={Colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(customer)/profile')} activeOpacity={0.8}>
              <Avatar name={user?.name ?? 'U'} size={38} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Active Bookings Summary */}
        {activeBookings.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Active Bookings"
              right={
                <TouchableOpacity onPress={() => router.push('/(customer)/bookings')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              }
            />
            {activeBookings.slice(0, 2).map((b) => (
              <BookingCard key={b.id} booking={b} onPress={() => router.push(`/booking/${b.id}`)} />
            ))}
          </View>
        )}

        {/* Emergency Service CTA */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={() => router.push('/booking/create?emergency=true')}
          activeOpacity={0.9}
        >
          <View style={styles.emergencyLeft}>
            <ZapIcon size={24} color={Colors.textInverse} fill={Colors.textInverse} />
            <View>
              <Text style={styles.emergencyTitle}>Emergency Service</Text>
              <Text style={styles.emergencySubtitle}>Get help within the hour</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.textInverse} />
        </TouchableOpacity>

        {/* Service Categories */}
        <View style={styles.section}>
          <SectionHeader title="Services" />
          <View style={styles.servicesGrid}>
            {filteredCategories.map((cat) => (
              <ServiceCategoryCard
                key={cat.id}
                cat={cat}
                onPress={() => router.push(`/booking/create?service=${cat.id}`)}
              />
            ))}
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <SectionHeader
            title="Recent Bookings"
            right={
              <TouchableOpacity onPress={() => router.push('/(customer)/bookings')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            }
          />
          {bookings.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No bookings yet. Book your first service!</Text>
            </Card>
          ) : (
            bookings.slice(0, 3).map((b) => (
              <BookingCard key={b.id} booking={b} compact onPress={() => router.push(`/booking/${b.id}`)} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  greeting: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  userName: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  notifBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: Colors.error, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: Colors.textInverse, fontSize: 9, fontWeight: Typography.fontWeight.bold },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.cardBackground, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, height: 46, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  searchInput: { flex: 1, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  section: { marginBottom: Spacing.xl },
  seeAll: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: Typography.fontWeight.semiBold },
  emergencyCard: {
    backgroundColor: Colors.error,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  emergencyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textInverse },
  emergencySubtitle: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.8)' },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  serviceCard: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.xs, ...Shadows.sm,
  },
  serviceIcon: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  serviceName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  serviceDesc: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  emptyText: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, textAlign: 'center', padding: Spacing.md },
});
