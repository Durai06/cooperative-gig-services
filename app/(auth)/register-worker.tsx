// ============================================================
// CoopConnect – Worker Registration Screen
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, User, Mail, Phone, Lock, MapPin, Briefcase,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, Shadows, SERVICE_CATEGORIES } from '@/constants';
import { MOCK_COOPERATIVES } from '@/services/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  experience: z.coerce.number().min(0).max(50),
  cooperativeId: z.string().min(1, 'Select a cooperative'),
  serviceLocation: z.string().min(3, 'Enter your service location'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterWorkerScreen() {
  const router = useRouter();
  const { registerWorker } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCoop, setSelectedCoop] = useState('');

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { experience: 1 },
  });

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const onSubmit = async (data: FormData) => {
    if (selectedSkills.length === 0) {
      Alert.alert('Skills Required', 'Please select at least one skill.');
      return;
    }
    setSubmitting(true);
    try {
      await registerWorker({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        skills: selectedSkills,
        experience: data.experience,
        cooperativeId: selectedCoop || data.cooperativeId,
        serviceLocation: data.serviceLocation,
      });
      router.replace('/(worker)');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>Worker Registration</Text>
          <Text style={styles.subtitle}>Join your cooperative and start earning</Text>

          {/* Pending Verification Notice */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              ℹ️ Your profile will be reviewed by your cooperative administrator before you appear as a verified worker.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller control={control} name="name" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Full Name" placeholder="Your full name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} leftIcon={<User size={18} color={Colors.textSecondary} />} autoCapitalize="words" />
            )} />

            <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Email" placeholder="you@example.com" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} leftIcon={<Mail size={18} color={Colors.textSecondary} />} keyboardType="email-address" autoCapitalize="none" />
            )} />

            <Controller control={control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Phone Number" placeholder="+91 98765 43210" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.phone?.message} leftIcon={<Phone size={18} color={Colors.textSecondary} />} keyboardType="phone-pad" />
            )} />

            <Controller control={control} name="experience" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Years of Experience" placeholder="e.g. 5" value={String(value || '')} onChangeText={onChange} onBlur={onBlur} error={errors.experience?.message} leftIcon={<Briefcase size={18} color={Colors.textSecondary} />} keyboardType="numeric" />
            )} />

            <Controller control={control} name="serviceLocation" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Service Location / Area" placeholder="e.g. Koramangala, Bengaluru" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.serviceLocation?.message} leftIcon={<MapPin size={18} color={Colors.textSecondary} />} />
            )} />

            {/* Skills */}
            <Text style={styles.fieldLabel}>Skills (select all that apply)</Text>
            <View style={styles.skillsGrid}>
              {SERVICE_CATEGORIES.map((cat) => {
                const sel = selectedSkills.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.skillChip, sel && styles.skillChipSelected]}
                    onPress={() => toggleSkill(cat.id)}
                  >
                    <Text style={[styles.skillChipText, sel && styles.skillChipTextSelected]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedSkills.length === 0 && (
              <Text style={styles.errorText}>Select at least one skill</Text>
            )}

            {/* Cooperative */}
            <Text style={styles.fieldLabel}>Cooperative Society</Text>
            <View style={styles.coopList}>
              {MOCK_COOPERATIVES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.coopRow, selectedCoop === c.id && styles.coopRowSelected]}
                  onPress={() => { setSelectedCoop(c.id); setValue('cooperativeId', c.id); }}
                >
                  <View>
                    <Text style={[styles.coopName, selectedCoop === c.id && styles.coopNameSelected]}>{c.name}</Text>
                    <Text style={styles.coopLoc}>{c.location}</Text>
                  </View>
                  {selectedCoop === c.id && (
                    <View style={styles.checkDot} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {errors.cooperativeId && <Text style={styles.errorText}>{errors.cooperativeId.message}</Text>}

            <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Password" placeholder="Minimum 6 characters" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} leftIcon={<Lock size={18} color={Colors.textSecondary} />} secureTextEntry containerStyle={{ marginTop: Spacing.md }} />
            )} />

            <Button label="Register as Worker" onPress={handleSubmit(onSubmit)} loading={submitting} fullWidth size="lg" variant="secondary" style={{ marginTop: Spacing.sm }} />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login?role=worker')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  backBtn: { marginBottom: Spacing.xl, padding: 4, alignSelf: 'flex-start' },
  title: { fontSize: Typography.fontSize.display, fontWeight: Typography.fontWeight.extraBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, marginBottom: Spacing.md },
  notice: { backgroundColor: Colors.infoLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  noticeText: { fontSize: Typography.fontSize.sm, color: Colors.info, lineHeight: 20 },
  form: { backgroundColor: Colors.cardBackground, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadows.md, marginBottom: Spacing.xl },
  fieldLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.xs },
  skillChip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  skillChipSelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryLight },
  skillChipText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  skillChipTextSelected: { color: Colors.secondary },
  coopList: { gap: Spacing.sm, marginBottom: Spacing.xs },
  coopRow: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coopRowSelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryLight },
  coopName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  coopNameSelected: { color: Colors.secondary },
  coopLoc: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  checkDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.secondary },
  errorText: { fontSize: Typography.fontSize.xs, color: Colors.error, marginTop: 2, marginBottom: Spacing.xs },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: Typography.fontSize.md, color: Colors.textSecondary },
  loginLink: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.secondary },
});
