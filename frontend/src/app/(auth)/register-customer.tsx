import { Alert } from "@/components/common/Feedback";
// ============================================================
// Sevai One – Customer Registration Screen
// ============================================================

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react-native";
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

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(10, "Enter a valid phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    address: z.string().min(5, "Enter a valid address"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof schema>;

export default function RegisterCustomerScreen() {
  const router = useRouter();
  const { registerCustomer } = useAuth();
  const [submitting, setSubmitting] = useState(false);

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
      await registerCustomer({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        address: data.address,
      });
      router.replace("/(customer)");
    } catch (err: any) {
      Alert.alert(
        "Registration Failed",
        err.message ?? "Something went wrong.",
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
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Auth mode toggle */}
          <View style={styles.authModeToggle}>
            <TouchableOpacity
              style={styles.authModeBtn}
              onPress={() => router.push("/(auth)/login?role=customer")}
            >
              <Text style={styles.authModeInactiveText}>Log In</Text>
            </TouchableOpacity>
            <View style={[styles.authModeBtn, styles.authModeActive]}>
              <Text style={styles.authModeActiveText}>Register as Customer</Text>
            </View>
          </View>

          <Text style={styles.title}>Customer Registration</Text>
          <Text style={styles.subtitle}>
            Create your account to book trusted local cooperative workers
          </Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Your full name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  leftIcon={<User size={18} color={Colors.textSecondary} />}
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
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

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="+91 98765 43210"
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
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Address"
                  placeholder="Your home address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.address?.message}
                  leftIcon={<MapPin size={18} color={Colors.textSecondary} />}
                  multiline
                  numberOfLines={2}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Minimum 6 characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  leftIcon={<Lock size={18} color={Colors.textSecondary} />}
                  secureTextEntry
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  leftIcon={<Lock size={18} color={Colors.textSecondary} />}
                  secureTextEntry
                />
              )}
            />

            <Button
              label="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login?role=customer")}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  backBtn: { marginBottom: Spacing.xl, padding: 4, alignSelf: "flex-start" },
  authModeToggle: {
    flexDirection: "row",
    backgroundColor: "#F0F4F8",
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.base,
  },
  authModeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
  },
  authModeActive: {
    backgroundColor: "#FFFFFF",
    ...Shadows.sm,
  },
  authModeActiveText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  authModeInactiveText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
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
  },
  form: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
    marginBottom: Spacing.xl,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: { fontSize: Typography.fontSize.md, color: Colors.textSecondary },
  loginLink: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
});
