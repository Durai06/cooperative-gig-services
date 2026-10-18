import { Alert } from "@/components/common/Feedback";
// ============================================================
// CoopConnect – Forgot Password Screen
// ============================================================

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import { mockAuthService } from "@/services/api/authService";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react-native";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PageFrame } from "@/components/common/ResponsiveLayout";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await mockAuthService.forgotPassword(data.email);
      setSent(true);
    } catch (err: any) {
      Alert.alert("Error", err.message);
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
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          {sent ? (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <CheckCircle size={48} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Demo Account Found</Text>
              <Text style={styles.successMsg}>
                This offline demo does not send email or reset passwords. Return
                to Login and use Demo Account to continue.
              </Text>
              <Button
                label="Back to Login"
                onPress={() => router.back()}
                fullWidth
                size="lg"
                style={{ marginTop: Spacing.xl }}
              />
            </View>
          ) : (
            <>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                Check whether an account exists in the offline demo. No email
                will be sent.
              </Text>

              <View style={styles.form}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Email Address"
                      placeholder="you@example.com"
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
                <Button
                  label="Check Demo Account"
                  onPress={handleSubmit(onSubmit)}
                  loading={submitting}
                  fullWidth
                  size="lg"
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
  container: { flexGrow: 1, padding: Spacing.base },
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
    gap: Spacing.md,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  successMsg: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
