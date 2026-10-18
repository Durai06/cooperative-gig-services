// ============================================================
// CoopConnect – Submit Rating & Review Screen
// Multi-criterion rating for worker performance & trade quality.
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, ShieldCheck, ThumbsUp, Send } from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants';
import { bookingService } from '@/services/api/bookingService';
import { ratingService } from '@/services/api/otherServices';
import type { Booking } from '@/types';
import { Card, Avatar, LoadingSpinner } from '@/components/common/UIKit';
import { Button } from '@/components/common/Button';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';

interface StarSelectorProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  description?: string;
}

function StarSelector({ label, value, onChange, description }: StarSelectorProps) {
  return (
    <View style={styles.starRowContainer}>
      <View style={styles.starLabelCol}>
        <Text style={styles.starLabel}>{label}</Text>
        {description && <Text style={styles.starDesc}>{description}</Text>}
      </View>
      <View style={styles.starsGroup}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => onChange(s)}
            activeOpacity={0.7}
            style={styles.starTouch}
          >
            <Star
              size={24}
              color={s <= value ? Colors.warning : Colors.border}
              fill={s <= value ? Colors.warning : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function SubmitRatingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [overall, setOverall] = useState(5);
  const [workQuality, setWorkQuality] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [behaviour, setBehaviour] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [review, setReview] = useState('');

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
    if (!booking || !booking.workerId) {
      Alert.alert('Error', 'Worker information not available for this booking.');
      return;
    }
    if (review.trim().length < 5) {
      Alert.alert('Feedback Required', 'Please enter at least a few words describing your experience.');
      return;
    }

    setSubmitting(true);
    try {
      await ratingService.submitRating({
        bookingId: booking.id,
        workerId: booking.workerId,
        overall,
        workQuality,
        punctuality,
        behaviour,
        professionalism,
        review: review.trim(),
      });

      Alert.alert(
        'Thank You!',
        'Your review has been submitted to the Labour Cooperative Society. Fair ratings strengthen worker livelihoods.',
        [
          {
            text: 'Done',
            onPress: () => router.replace(`/booking/${booking.id}` as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Could not submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Rate & Review" showBack />
        <LoadingSpinner message="Loading booking details..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Rate & Review" showBack />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Worker summary header */}
          <Card style={styles.workerSummary}>
            <Avatar
              name={booking?.worker?.user?.name ?? 'Worker'}
              size={54}
              backgroundColor={Colors.primary}
              textColor={Colors.surface}
            />
            <View style={styles.workerDetails}>
              <Text style={styles.workerName}>{booking?.worker?.user?.name ?? 'Assigned Worker'}</Text>
              <Text style={styles.serviceName}>{booking?.service?.name ?? 'Service Completed'}</Text>
              <Text style={styles.coopText}>{booking?.worker?.cooperative?.name ?? 'Labour Cooperative Society'}</Text>
            </View>
          </Card>

          {/* Rating Criteria */}
          <Card style={styles.ratingsCard}>
            <Text style={styles.sectionTitle}>Performance Criteria</Text>

            <StarSelector
              label="Overall Experience"
              description="General satisfaction with the service"
              value={overall}
              onChange={setOverall}
            />
            <StarSelector
              label="Work Quality"
              description="Technical competence & cleanliness"
              value={workQuality}
              onChange={setWorkQuality}
            />
            <StarSelector
              label="Punctuality"
              description="Arrived on scheduled time"
              value={punctuality}
              onChange={setPunctuality}
            />
            <StarSelector
              label="Behaviour & Courtesy"
              description="Polite, respectful, and courteous"
              value={behaviour}
              onChange={setBehaviour}
            />
            <StarSelector
              label="Professionalism"
              description="Adherence to cooperative fair standards"
              value={professionalism}
              onChange={setProfessionalism}
            />
          </Card>

          {/* Written Review */}
          <Card style={styles.reviewCard}>
            <Text style={styles.sectionTitle}>Detailed Feedback</Text>
            <Text style={styles.reviewPrompt}>
              Share honest feedback to help other society members and workers.
            </Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="Describe the quality of work, punctuality, and conduct..."
              placeholderTextColor={Colors.textDisabled}
              value={review}
              onChangeText={setReview}
              textAlignVertical="top"
            />
          </Card>

          {/* Submit Button */}
          <Button
            title="Submit Cooperative Review"
            variant="primary"
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
  workerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  workerDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  workerName: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
  },
  serviceName: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  coopText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratingsCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  starRowContainer: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  starLabelCol: {
    marginBottom: 4,
  },
  starLabel: {
    ...Typography.subtitle2,
    color: Colors.textPrimary,
  },
  starDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  starsGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  starTouch: {
    padding: 2,
  },
  reviewCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reviewPrompt: {
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
    minHeight: 100,
    ...Typography.body2,
    color: Colors.textPrimary,
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
});
