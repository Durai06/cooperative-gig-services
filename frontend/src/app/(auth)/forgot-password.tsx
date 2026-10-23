import { Alert } from "@/components/common/Feedback";
// ============================================================
// Sevai One – Self-Service Password Reset Screen
// ============================================================

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import { authService } from "@/services/api/authService";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, Lock, Mail, Phone } from "lucide-react-native";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PageFrame } from "@/components/common/ResponsiveLayout";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(10, "Enter your 10-digit registered phone number"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      phone: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await authService.resetPassword({
        email: data.email.trim(),
        phone: data.phone.trim(),
        newPassword: data.newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      Alert.alert(
        "Reset Failed",
        err.message ?? "Could not reset password. Please verify your details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageFrame form style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          {success ? (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <CheckCircle2 size={54} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Password Updated</Text>
              <Text style={styles.successMsg}>
                Your password has been reset successfully. You can now log in using your new credentials.
              </Text>
              <Button
                label="Back to Sign In"
                onPress={() => router.back()}
                fullWidth
                size="lg"
                style={{ marginTop: Spacing.xl }}
              />
            </View>
          ) : (
            <>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Verify your registered account details to set a new password.
              </Text>

              <View style={styles.form}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Registered Email"
                      placeholder="e.g. arjun@example.com"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                      leftIcon={<Mail size={18} color={Colors.textSecondary} />}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Registered Phone Number"
                      placeholder="e.g. 98765 11111"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.phone?.message}
                      leftIcon={<Phone size={18} color={Colors.textSecondary} />}
                      keyboardType="phone-pad"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="New Password"
                      placeholder="At least 6 characters"
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.newPassword?.message}
                      leftIcon={<Lock size={18} color={Colors.textSecondary} />}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Confirm New Password"
                      placeholder="Re-enter new password"
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.confirmPassword?.message}
                      leftIcon={<Lock size={18} color={Colors.textSecondary} />}
                    />
                  )}
                />

                <Button
                  label="Update Password"
                  onPress={handleSubmit(onSubmit)}
                  loading={submitting}
                  fullWidth
                  size="lg"
                  style={{ marginTop: Spacing.md }}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  container: { flexGrow: 1, padding: Spacing.base, paddingBottom: Spacing.xxxl },
  backBtn: { marginBottom: Spacing.xl, padding: 4, alignSelf: "flex-start" },
  title: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.extraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  form: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EDFAF0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  successMsg: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
});
