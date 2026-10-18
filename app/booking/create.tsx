// ============================================================
// CoopConnect – Create Booking Screen
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Calendar, Clock, Zap, FileText } from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, Shadows, SERVICE_CATEGORIES } from '@/constants';
import { MOCK_SERVICES as MS } from '@/services/mockData';
import { bookingService } from '@/services/api/bookingService';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ScreenHeader } from '@/components/common/ScreenHeader';

const schema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  description: z.string().min(10, 'Please describe the problem (min 10 characters)'),
  location: z.string().min(5, 'Enter a service address'),
  preferredDate: z.string().min(1, 'Select a preferred date'),
  preferredTime: z.string().min(1, 'Select a preferred time'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

export default function CreateBookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ service?: string; emergency?: string }>();

  const [emergency, setEmergency] = useState(params.emergency === 'true');
  const [submitting, setSubmitting] = useState(false);

  const defaultService = MS.find((s) => s.category === params.service)?.id ?? '';

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceId: defaultService,
      description: '',
      location: user?.address ?? '',
      preferredDate: '',
      preferredTime: '',
      notes: '',
    },
  });

  const selectedServiceId = watch('serviceId');
  const selectedTime = watch('preferredTime');

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const booking = await bookingService.createBooking(user.id, {
        serviceId: data.serviceId,
        description: data.description,
        location: data.location,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        emergency,
        notes: data.notes,
      });
      router.replace(`/booking/workers?bookingId=${booking.id}`);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  // Simple date generator: today + next 7 days
  const today = new Date();
  const dateOptions = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      value: d.toISOString().split('T')[0],
    };
  });

  const selectedDate = watch('preferredDate');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Book a Service" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Service Selection */}
          <Text style={styles.fieldLabel}>Select Service</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceScroll}>
            {MS.map((svc) => {
              const sel = selectedServiceId === svc.id;
              return (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.serviceChip, sel && styles.serviceChipSelected]}
                  onPress={() => setValue('serviceId', svc.id)}
                >
                  <Text style={[styles.serviceChipText, sel && styles.serviceChipTextSelected]}>
                    {svc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {errors.serviceId && <Text style={styles.errorText}>{errors.serviceId.message}</Text>}

          {/* Emergency Toggle */}
          <View style={[styles.emergencyToggle, emergency && styles.emergencyToggleActive]}>
            <View>
              <Text style={[styles.emergencyTitle, emergency && styles.emergencyTitleActive]}>
                🚨 Emergency Service
              </Text>
              <Text style={[styles.emergencySubtitle, emergency && styles.emergencySubtitleActive]}>
                Priority dispatch within 1 hour
              </Text>
            </View>
            <Switch
              value={emergency}
              onValueChange={setEmergency}
              trackColor={{ false: Colors.border, true: Colors.emergency }}
              thumbColor={Colors.cardBackground}
            />
          </View>

          {/* Description */}
          <Controller control={control} name="description" render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Describe the Problem"
              placeholder="Explain what needs to be fixed or done…"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.description?.message}
              multiline
              numberOfLines={3}
              leftIcon={<FileText size={18} color={Colors.textSecondary} />}
            />
          )} />

          {/* Location */}
          <Controller control={control} name="location" render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Service Address"
              placeholder="Where do you need the service?"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.location?.message}
              leftIcon={<MapPin size={18} color={Colors.textSecondary} />}
              multiline
            />
          )} />

          {/* Date */}
          <Text style={styles.fieldLabel}>Preferred Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dateOptions.map((d) => {
              const sel = selectedDate === d.value;
              return (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.dateChip, sel && styles.dateChipSelected]}
                  onPress={() => setValue('preferredDate', d.value)}
                >
                  <Text style={[styles.dateChipText, sel && styles.dateChipTextSelected]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {errors.preferredDate && <Text style={styles.errorText}>{errors.preferredDate.message}</Text>}

          {/* Time */}
          <Text style={styles.fieldLabel}>Preferred Time</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((t) => {
              const sel = selectedTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, sel && styles.timeChipSelected]}
                  onPress={() => setValue('preferredTime', t)}
                >
                  <Text style={[styles.timeChipText, sel && styles.timeChipTextSelected]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.preferredTime && <Text style={styles.errorText}>{errors.preferredTime.message}</Text>}

          {/* Notes */}
          <Controller control={control} name="notes" render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Additional Notes (optional)"
              placeholder="Any specific requirements…"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={2}
            />
          )} />

          <Button
            label="Continue to Find Workers"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  fieldLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary, marginBottom: Spacing.sm },
  serviceScroll: { marginBottom: Spacing.md },
  serviceChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, marginRight: Spacing.sm, backgroundColor: Colors.cardBackground },
  serviceChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  serviceChipText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  serviceChipTextSelected: { color: Colors.primary },
  emergencyToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  emergencyToggleActive: { borderColor: Colors.emergency, backgroundColor: Colors.emergencyLight },
  emergencyTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semiBold, color: Colors.textPrimary },
  emergencyTitleActive: { color: Colors.emergency },
  emergencySubtitle: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  emergencySubtitleActive: { color: Colors.emergency },
  dateScroll: { marginBottom: Spacing.md },
  dateChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, marginRight: Spacing.sm, backgroundColor: Colors.cardBackground },
  dateChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dateChipText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  dateChipTextSelected: { color: Colors.textInverse },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  timeChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.cardBackground },
  timeChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  timeChipText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  timeChipTextSelected: { color: Colors.textInverse },
  errorText: { fontSize: Typography.fontSize.xs, color: Colors.error, marginTop: -8, marginBottom: Spacing.md },
});
