// ============================================================
// CoopConnect – Administrator Grievance Mediation Center
// Customer complaint investigation, status tracking & resolution.
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ShieldAlert, AlertTriangle, CheckCircle, Clock,
  MessageSquare, User, FileText, ChevronRight, X,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants';
import { complaintService } from '@/services/api/otherServices';
import type { Complaint, ComplaintStatus } from '@/types';
import { Card, Badge, LoadingSpinner, EmptyState, Divider } from '@/components/common/UIKit';
import { Button } from '@/components/common/Button';
import { ScreenHeader } from '@/components/common/ScreenHeader';

type ComplaintFilter = 'all' | 'open' | 'under_review' | 'resolved';

const CATEGORY_LABELS: Record<string, string> = {
  worker_no_show: 'Worker No Show',
  poor_service: 'Poor Service Quality',
  overcharging: 'Overcharging Dispute',
  behaviour_issue: 'Unprofessional Conduct',
  other: 'General Issue',
};

export default function AdminComplaintsScreen() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ComplaintFilter>('open');

  // Resolution modal state
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [savingResolution, setSavingResolution] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await complaintService.getAllComplaints();
      setComplaints(data);
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

  const handleStatusChange = async (id: string, newStatus: ComplaintStatus, note?: string) => {
    try {
      await complaintService.updateComplaintStatus(id, newStatus, note);
      Alert.alert('Status Updated', `Grievance status changed to ${newStatus.replace('_', ' ')}.`);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update status');
    }
  };

  const handleConfirmResolution = async () => {
    if (!resolvingComplaint) return;
    if (resolutionText.trim().length < 10) {
      Alert.alert('Details Required', 'Please enter a clear resolution summary (min 10 characters).');
      return;
    }

    setSavingResolution(true);
    try {
      await complaintService.updateComplaintStatus(
        resolvingComplaint.id,
        'resolved',
        resolutionText.trim()
      );
      setResolvingComplaint(null);
      setResolutionText('');
      Alert.alert('Grievance Resolved', 'Resolution recorded. Both customer and worker have been notified.');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save resolution.');
    } finally {
      setSavingResolution(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const openCount = complaints.filter((c) => c.status === 'open').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Grievance Mediation Center" />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['open', 'under_review', 'resolved', 'all'] as ComplaintFilter[]).map((tab) => {
          const isActive = filter === tab;
          const label =
            tab === 'open'
              ? `Open (${openCount})`
              : tab === 'under_review'
              ? 'Under Review'
              : tab === 'resolved'
              ? 'Resolved'
              : 'All History';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setFilter(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
        {loading ? (
          <LoadingSpinner message="Loading society grievances..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={48} color={Colors.success} />}
            title="No Grievances Found"
            message={`There are currently no complaints in the '${filter.replace('_', ' ')}' category.`}
          />
        ) : (
          filtered.map((c) => (
            <Card key={c.id} style={styles.complaintCard}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryWrap}>
                  <Badge
                    label={CATEGORY_LABELS[c.category] ?? c.category}
                    variant={c.status === 'open' ? 'danger' : c.status === 'resolved' ? 'success' : 'warning'}
                    size="sm"
                  />
                  <Text style={styles.bookingId}>Booking: #{c.bookingId.slice(-6).toUpperCase()}</Text>
                </View>
                <Text style={styles.dateText}>
                  {format(new Date(c.createdAt), 'dd MMM yyyy')}
                </Text>
              </View>

              <Text style={styles.customerText}>
                Complainant: <Text style={{ fontWeight: '600', color: Colors.textPrimary }}>{c.customer?.name ?? 'Customer'}</Text>
              </Text>

              <View style={styles.descriptionBox}>
                <Text style={styles.descText}>&ldquo;{c.description}&rdquo;</Text>
              </View>

              {/* Resolution Note if resolved */}
              {c.status === 'resolved' && c.resolutionNote && (
                <View style={styles.resolvedBox}>
                  <CheckCircle size={15} color={Colors.success} />
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={styles.resolvedTitle}>Arbitration Ruling / Resolution:</Text>
                    <Text style={styles.resolvedText}>{c.resolutionNote}</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {c.status === 'open' && (
                  <Button
                    title="Move to Under Review"
                    variant="outline"
                    size="sm"
                    onPress={() => handleStatusChange(c.id, 'under_review')}
                    style={{ marginRight: Spacing.sm }}
                  />
                )}

                {c.status !== 'resolved' && (
                  <Button
                    title="Arbitrate & Resolve"
                    variant="primary"
                    size="sm"
                    onPress={() => {
                      setResolvingComplaint(c);
                      setResolutionText('');
                    }}
                  />
                )}

                <Button
                  title="View Booking"
                  variant="outline"
                  size="sm"
                  onPress={() => router.push(`/booking/${c.bookingId}` as any)}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Resolution Modal */}
      <Modal
        visible={!!resolvingComplaint}
        transparent
        animationType="fade"
        onRequestClose={() => setResolvingComplaint(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resolve Customer Grievance</Text>
              <TouchableOpacity onPress={() => setResolvingComplaint(null)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalPrompt}>
              Record the Labour Cooperative committee&apos;s arbitration outcome (e.g. partial refund, worker retraining, or warning issued):
            </Text>

            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              placeholder="Enter resolution notes and actions taken..."
              placeholderTextColor={Colors.textDisabled}
              value={resolutionText}
              onChangeText={setResolutionText}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setResolvingComplaint(null)}
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <Button
                title="Confirm Resolution"
                variant="success"
                size="md"
                loading={savingResolution}
                onPress={handleConfirmResolution}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    gap: 6,
    flexWrap: 'wrap',
  },
  tabBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSecondary,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.surface,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  complaintCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingId: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  customerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  descriptionBox: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
  descText: {
    ...Typography.body2,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  resolvedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.successLight + '25',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  resolvedTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.successDark,
  },
  resolvedText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexWrap: 'wrap',
    gap: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  modalPrompt: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 100,
    ...Typography.body2,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
  },
});
