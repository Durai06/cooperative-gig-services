// ============================================================
// CoopConnect – File Complaint Screen
// Formal dispute resolution via Labour Cooperative Society admin.
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle, ShieldAlert, CheckCircle2, Scale,
  UserX, FileWarning, DollarSign, MessageSquare, HelpCircle,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants';
import { bookingService } from '@/services/api/bookingService';
import { complaintService } from '@/services/api/otherServices';
import type { Booking, ComplaintCategory } from '@/types';
import { Card, LoadingSpinner } from '@/components/common/UIKit';
import { Button } from '@/components/common/Button';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';

const COMPLAINT_CATEGORIES: {
  key: ComplaintCategory;
  label: string;
  description: string;
  icon: any;
}[] = [
  {
    key: 'worker_no_show',
    label: 'Worker Did Not Show Up',
    description: 'Worker did not arrive at the scheduled time or address.',
    icon: UserX,
  },
  {
    key: 'poor_service',
    label: 'Poor Work Quality',
    description: 'Job was incomplete, substandard, or caused damage.',
    icon: FileWarning,
  },
  {
    key: 'overcharging',
    label: 'Overcharging / Price Dispute',
    description: 'Billed amount exceeded standard cooperative rates.',
    icon: DollarSign,
  },
  {
    key: 'behaviour_issue',
    label: 'Unprofessional Conduct',
    description: 'Disrespectful behaviour, refusal to follow safety guidelines.',
    icon: MessageSquare,
  },
  {
    key: 'other',
    label: 'Other Issue',
    description: 'Any other grievance requiring cooperative mediation.',
    icon: HelpCircle,
  },
];

export default function FileComplaintScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<ComplaintCategory>('poor_service');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function load() {
      if (!bookingId) return;
      try {
        const b = await bookingService.getBookingById(bookingId);
        if (b) setBooking(b);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!bookingId) {
      Alert.alert('Error', 'Missing booking reference.');
      return;
    }
    if (description.trim().length < 20) {
      Alert.alert(
        'More Details Required',
        'Please provide at least 20 characters explaining what happened so our society administrator can investigate properly.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await complaintService.submitComplaint(user.id, {
        bookingId,
        category,
        description: description.trim(),
      });

      Alert.alert(
        'Complaint Lodged',
        'Your dispute has been logged with the Labour Cooperative Society administrator. An officer will review and reach out within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/booking/${bookingId}` as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Could not submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Report an Issue" showBack />
        <LoadingSpinner message="Loading booking details..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Report an Issue" showBack />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Dispute Mediation Notice */}
          <View style={styles.noticeBox}>
            <Scale size={22} color={Colors.error} style={styles.noticeIcon} />
            <View style={styles.noticeTextCol}>
              <Text style={styles.noticeTitle}>Cooperative Mediation Process</Text>
              <Text style={styles.noticeDesc}>
                Unlike corporate gig apps, Labour Cooperative Societies resolve all complaints through human committee review to protect both customer rights and worker livelihood fairness.
              </Text>
            </View>
          </View>

          {/* Booking Summary */}
          {booking && (
            <Card style={styles.summaryCard}>
              <Text style={styles.bookingRef}>Booking Ref: #{booking.id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.serviceName}>{booking.service?.name}</Text>
              {booking.worker && (
                <Text style={styles.workerName}>Assigned Worker: {booking.worker.user?.name}</Text>
              )}
            </Card>
          )}

          {/* Category Selection */}
          <Text style={styles.sectionTitle}>Select Issue Category</Text>
          <View style={styles.categoryList}>
            {COMPLAINT_CATEGORIES.map((item) => {
              const isSelected = category === item.key;
              const IconComp = item.icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.categoryItem,
                    isSelected && styles.categoryItemSelected,
                  ]}
                  onPress={() => setCategory(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.catIconWrap, isSelected && styles.catIconWrapSelected]}>
                    <IconComp
                      size={20}
                      color={isSelected ? Colors.error : Colors.textSecondary}
                    />
                  </View>
                  <View style={styles.catContent}>
                    <Text style={[styles.catLabel, isSelected && styles.catLabelSelected]}>
                      {item.label}
                    </Text>
                    <Text style={styles.catDesc}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Card style={styles.descCard}>
            <Text style={styles.descTitle}>Detailed Explanation</Text>
            <Text style={styles.descPrompt}>
              Provide all relevant facts, including timestamps, damages, or discrepancies.
            </Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={5}
              placeholder="Explain what occurred during the service call..."
              placeholderTextColor={Colors.textDisabled}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </Card>

          {/* Submit Button */}
          <Button
            title="Lodge Grievance with Cooperative"
            variant="danger"
            size="lg"
            loading={submitting}
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  root: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: Colors.errorLight + '20',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  noticeIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  noticeTextCol: {
    flex: 1,
  },
  noticeTitle: {
    ...Typography.subtitle2,
    color: Colors.errorDark,
    marginBottom: 2,
  },
  noticeDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  summaryCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  bookingRef: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  serviceName: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  workerName: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  categoryList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryItemSelected: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight + '10',
  },
  catIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  catIconWrapSelected: {
    backgroundColor: Colors.errorLight + '30',
  },
  catContent: {
    flex: 1,
  },
  catLabel: {
    ...Typography.subtitle2,
    color: Colors.textPrimary,
  },
  catLabelSelected: {
    color: Colors.errorDark,
    fontWeight: '700',
  },
  catDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  descCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  descTitle: {
    ...Typography.subtitle2,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  descPrompt: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 120,
    ...Typography.body2,
    color: Colors.textPrimary,
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
});
