// ============================================================
// CoopConnect – Customer Notifications Screen
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CheckCheck } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/api/otherServices';
import type { AppNotification } from '@/types';
import { LoadingSpinner, EmptyState } from '@/components/common/UIKit';

const NOTIFICATION_ICONS: Record<string, string> = {
  new_job_request: '🔔',
  worker_assigned: '👷',
  booking_accepted: '✅',
  booking_cancelled: '❌',
  job_in_progress: '🔧',
  service_completed: '🎉',
  new_review: '⭐',
  complaint_update: '📋',
  verification_update: '🛡️',
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await notificationService.getUserNotifications(user.id);
    setNotifications(data);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <LoadingSpinner label="Loading notifications…" />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <CheckCheck size={16} color={Colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={32} color={Colors.textMuted} />}
            title="No notifications"
            subtitle="You'll see updates about your bookings here."
          />
        ) : (
          notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.card, !n.read && styles.cardUnread]}
              onPress={() => markRead(n.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.notifIcon}>{NOTIFICATION_ICONS[n.type] ?? '📱'}</Text>
              <View style={styles.notifBody}>
                <Text style={[styles.notifTitle, !n.read && styles.notifTitleUnread]}>
                  {n.title}
                </Text>
                <Text style={styles.notifText} numberOfLines={2}>{n.body}</Text>
                <Text style={styles.notifTime}>
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </Text>
              </View>
              {!n.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: Spacing.base,
  },
  title: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.extraBold, color: Colors.textPrimary },
  unreadCount: { fontSize: Typography.fontSize.sm, color: Colors.primary, marginTop: 2 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  markAllText: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  scroll: { padding: Spacing.base, paddingTop: 0, paddingBottom: Spacing.xxxl },
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    ...Shadows.sm,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  notifIcon: { fontSize: 24, marginTop: 2 },
  notifBody: { flex: 1, gap: 4 },
  notifTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semiBold, color: Colors.textPrimary },
  notifTitleUnread: { fontWeight: Typography.fontWeight.bold },
  notifText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  notifTime: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 },
});
