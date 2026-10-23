import { Brand } from "@/components/common/Brand";
import { Alert } from "@/components/common/Feedback";
// ============================================================
// Sevai One – Login Screen
// ============================================================

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Briefcase,
  Lock,
  Mail,
  Shield,
  Users,
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

// ─── Validation ──────────────────────────────────────────────

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

const ROLE_META = {
  customer: {
    label: "Customer",
    icon: <Users size={18} color={Colors.primary} />,
    color: Colors.primary,
  },
  worker: {
    label: "Worker",
    icon: <Briefcase size={18} color={Colors.secondary} />,
    color: Colors.secondary,
  },
  admin: {
    label: "Admin",
    icon: <Shield size={18} color={Colors.primaryDark} />,
    color: Colors.primaryDark,
  },
};

// ─── Demo Logins ─────────────────────────────────────────────

const DEMO = {
  customer: "customer@coopconnect.in",
  worker: "worker@coopconnect.in",
  admin: "admin@coopconnect.in",
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const currentRole = params.role ?? "customer";
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const meta = ROLE_META[currentRole as keyof typeof ROLE_META] ?? ROLE_META.customer;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const loggedUser = await login({
        email: data.email,
        password: data.password,
      });
      if (loggedUser.role === "admin") {
        router.replace("/(admin)");
      } else if (loggedUser.role === "worker") {
        router.replace("/(worker)");
      } else {
        router.replace("/(customer)");
      }
    } catch (err: any) {
      Alert.alert(
        "Login Failed",
        err.message ?? "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    const email = DEMO[currentRole as keyof typeof DEMO] ?? DEMO.customer;
    setValue("email", email);
    setValue("password", "password123");
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
          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Brand />
          </View>

          {/* Auth mode toggle - only shows current role */}
          <View style={styles.authModeToggle}>
            <View style={[styles.authModeBtn, styles.authModeActive]}>
              <Text style={styles.authModeActiveText}>Log In</Text>
            </View>
            <TouchableOpacity
              style={styles.authModeBtn}
              onPress={() => {
                if (currentRole === "worker") {
                  router.push("/(auth)/register-worker");
                } else if (currentRole === "customer") {
                  router.push("/(auth)/register-customer");
                } else {
                  Alert.alert(
                    "Admin Registration",
                    "Cooperative Admin accounts are provisioned directly by the Cooperative Society management.",
                  );
                }
              }}
            >
              <Text style={styles.authModeInactiveText}>
                {currentRole === "worker"
                  ? "Register as Worker"
                  : currentRole === "customer"
                    ? "Register as Customer"
                    : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Role badge */}
          <View style={[styles.roleBadge, { borderColor: meta.color }]}>
            {meta.icon}
            <Text style={[styles.roleBadgeText, { color: meta.color }]}>
              {meta.label} Account
            </Text>
          </View>

          <Text style={styles.title}>{meta.label} Sign In</Text>
          <Text style={styles.subtitle}>
            Enter your credentials to access your {meta.label.toLowerCase()} account
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  leftIcon={<Mail size={18} color={Colors.textSecondary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  leftIcon={<Lock size={18} color={Colors.textSecondary} />}
                />
              )}
            />

            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              label="Login"
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              fullWidth
              size="lg"
              style={styles.submitBtn}
            />

            {/* Hidden demo autofill helper for testing */}
            <TouchableOpacity
              onPress={fillDemo}
              style={styles.demoLink}
              accessibilityLabel="Fill demo credentials"
            >
              <Text style={styles.demoLinkText}>Demo credentials autofill</Text>
            </TouchableOpacity>
          </View>

          {/* Register link – only for customer & worker */}
          {(currentRole === "customer" || currentRole === "worker") && (
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>
                Don&apos;t have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    currentRole === "worker"
                      ? "/(auth)/register-worker"
                      : "/(auth)/register-customer",
                  )
                }
              >
                <Text style={[styles.registerLink, { color: meta.color }]}>
                  Sign Up as {meta.label}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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

  demoLink: {
    alignSelf: "center",
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  demoLinkText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textDecorationLine: "underline",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    marginBottom: Spacing.md,
    backgroundColor: Colors.cardBackground,
  },
  roleBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
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
    marginBottom: Spacing.lg,
  },
  form: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    padding: 0,
    marginBottom: Spacing.xl,
  },
  forgotLink: { alignSelf: "flex-end", marginBottom: Spacing.lg },
  forgotText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  submitBtn: { marginBottom: Spacing.md },
  registerRow: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
});
