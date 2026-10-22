// ============================================================
// CoopConnect – Customer Profile Screen
// ============================================================

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User, Phone, Mail, MapPin, LogOut, ChevronRight,
  Shield, FileText, HelpCircle, Bell,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Card, Divider } from '@/components/common/UIKit';


interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}

function MenuItem({ icon, label, onPress, danger = false, right }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>{icon}</View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {right ?? <ChevronRight size={18} color={Colors.textSecondary} />}
    </TouchableOpacity>
  );
}

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

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
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <Avatar name={user?.name ?? 'U'} size={64} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userRole}>Customer Account</Text>
            </View>
          </View>
          <Divider style={{ marginVertical: Spacing.md }} />
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Mail size={14} color={Colors.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>{user?.email}</Text>
            </View>
            <View style={styles.detailItem}>
              <Phone size={14} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{user?.phone}</Text>
            </View>
            {user?.address && (
              <View style={styles.detailItem}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.detailText} numberOfLines={2}>{user.address}</Text>
              </View>
            )}
          </View>
        </Card>



        {/* Menu */}
        <Card style={styles.menuCard}>
          <MenuItem
            icon={<User size={18} color={Colors.primary} />}
            label="Edit Profile"
            onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon.')}
          />
          <Divider />
          <MenuItem
            icon={<Bell size={18} color={Colors.primary} />}
            label="Notification Settings"
            onPress={() => Alert.alert('Notifications', 'Notification settings coming soon.')}
          />
          <Divider />
          <MenuItem
            icon={<FileText size={18} color={Colors.primary} />}
            label="My Complaints"
            onPress={() => router.push('/complaint/list' as any)}
          />
          <Divider />
          <MenuItem
            icon={<Shield size={18} color={Colors.primary} />}
            label="Privacy & Terms"
            onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon.')}
          />
          <Divider />
          <MenuItem
            icon={<HelpCircle size={18} color={Colors.primary} />}
            label="Help & Support"
            onPress={() => Alert.alert('Support', 'Contact support@coopconnect.in')}
          />
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Sevai One</Text>
          <Text style={styles.appVersion}>v1.0.0 · Mock Mode</Text>
        </View>

        {/* Logout */}
        <Card style={styles.menuCard}>
          <MenuItem
            icon={<LogOut size={18} color={Colors.error} />}
            label="Sign Out"
            onPress={handleLogout}
            danger
            right={<View />}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  title: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.extraBold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  userCard: { marginBottom: Spacing.lg },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  userRole: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  detailsGrid: { gap: Spacing.sm },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  detailText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, flex: 1 },
  menuCard: { marginBottom: Spacing.md, padding: 0, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: Colors.errorLight },
  menuLabel: { flex: 1, fontSize: Typography.fontSize.md, color: Colors.textPrimary, fontWeight: Typography.fontWeight.medium },
  menuLabelDanger: { color: Colors.error },
  appInfo: { alignItems: 'center', marginVertical: Spacing.lg },
  appName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  appVersion: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
