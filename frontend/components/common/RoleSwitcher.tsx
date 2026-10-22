import { Alert } from "@/components/common/Feedback";
// ============================================================
// CoopConnect – Role Switcher Modal & Buttons
// Allows quick testing and switching between Customer, Worker,
// and Cooperative Administrator accounts.
// ============================================================

import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";
import { useRouter } from "expo-router";
import {
  Briefcase,
  Check,
  ChevronDown,
  LogOut,
  RefreshCw,
  Shield,
  Users,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface RoleOption {
  role: UserRole;
  name: string;
  email: string;
  persona: string;
  route: string;
  color: string;
  bgColor: string;
  icon: (size: number, color: string) => React.ReactNode;
}

const ROLES: RoleOption[] = [
  {
    role: "customer",
    name: "Customer Account",
    email: "customer@coopconnect.in",
    persona: "Arjun Sharma · Book services & reviews",
    route: "/(customer)",
    color: "#0D9488",
    bgColor: "#CCFBF1",
    icon: (s, c) => <Users size={s} color={c} />,
  },
  {
    role: "worker",
    name: "Skilled Worker",
    email: "worker@coopconnect.in",
    persona: "Ravi Kumar · Jobs, schedule & earnings",
    route: "/(worker)",
    color: "#059669",
    bgColor: "#D1FAE5",
    icon: (s, c) => <Briefcase size={s} color={c} />,
  },
  {
    role: "admin",
    name: "Cooperative Admin",
    email: "admin@coopconnect.in",
    persona: "Kavya Reddy · Verify workers & complaints",
    route: "/(admin)",
    color: "#4F46E5",
    bgColor: "#EEF2FF",
    icon: (s, c) => <Shield size={s} color={c} />,
  },
];

export function RoleSwitcherModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user, switchRole, logout } = useAuth();
  const [switchingRole, setSwitchingRole] = useState<UserRole | null>(null);

  const handleSelectRole = async (target: RoleOption) => {
    if (user?.role === target.role) {
      onClose();
      return;
    }
    setSwitchingRole(target.role);
    try {
      await switchRole(target.role);
      onClose();
      router.replace(target.route as any);
    } catch (err: any) {
      console.error("Failed to switch role:", err);
      if (Platform.OS === "web") {
        window.alert(err.message || "Failed to switch role");
      } else {
        Alert.alert("Error", err.message || "Failed to switch role");
      }
    } finally {
      setSwitchingRole(null);
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
        onClose();
        router.replace("/roles");
      } catch (err) {
        console.error("Logout error:", err);
      }
    };

    if (Platform.OS === "web") {
      if (
        typeof window !== "undefined" &&
        window.confirm("Are you sure you want to sign out?")
      ) {
        await doLogout();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Switch Account / Role</Text>
              <Text style={styles.modalSubtitle}>
                Test all 3 roles in Sevai One
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Role Cards */}
          <View style={styles.roleList}>
            {ROLES.map((r) => {
              const isCurrent = user?.role === r.role;
              const isPending = switchingRole === r.role;

              return (
                <TouchableOpacity
                  key={r.role}
                  style={[
                    styles.roleCard,
                    isCurrent && {
                      borderColor: r.color,
                      backgroundColor: r.bgColor + "40",
                    },
                  ]}
                  onPress={() => handleSelectRole(r)}
                  disabled={switchingRole !== null}
                  activeOpacity={0.8}
                >
                  <View
                    style={[styles.roleIcon, { backgroundColor: r.bgColor }]}
                  >
                    {r.icon(22, r.color)}
                  </View>

                  <View style={styles.roleInfo}>
                    <View style={styles.roleTitleRow}>
                      <Text style={styles.roleName}>{r.name}</Text>
                      {isCurrent && (
                        <View
                          style={[
                            styles.activeBadge,
                            { backgroundColor: r.color },
                          ]}
                        >
                          <Text style={styles.activeBadgeText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rolePersona}>{r.persona}</Text>
                    <Text style={styles.roleEmail}>{r.email}</Text>
                  </View>

                  <View style={styles.actionCol}>
                    {isPending ? (
                      <ActivityIndicator size="small" color={r.color} />
                    ) : isCurrent ? (
                      <Check size={20} color={r.color} />
                    ) : (
                      <Text style={[styles.switchLink, { color: r.color }]}>
                        Switch
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sign Out Option */}
          <TouchableOpacity
            style={styles.signOutRow}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={18} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out to Welcome Screen</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * Compact Header Button that displays current role and triggers the switcher
 */
export function RoleSwitcherButton() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const currentRole = ROLES.find((r) => r.role === user?.role) ?? ROLES[0];

  return (
    <>
      <TouchableOpacity
        style={[styles.pillButton, { borderColor: currentRole.color + "60" }]}
        onPress={() => setModalOpen(true)}
        activeOpacity={0.8}
      >
        <View
          style={[styles.pillDot, { backgroundColor: currentRole.color }]}
        />
        <Text style={styles.pillText}>{currentRole.name.split(" ")[0]}</Text>
        <ChevronDown size={14} color={Colors.textSecondary} />
      </TouchableOpacity>

      <RoleSwitcherModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

/**
 * Inline Switcher Card for Profile screens
 */
export function RoleSwitcherCard() {
  const [modalOpen, setModalOpen] = useState(false);
  const { user, switchRole } = useAuth();
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  const handleQuickSwitch = async (
    targetRole: UserRole,
    targetRoute: string,
  ) => {
    if (user?.role === targetRole) return;
    setLoadingRole(targetRole);
    try {
      await switchRole(targetRole);
      router.replace(targetRoute as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <View style={styles.inlineCard}>
      <View style={styles.inlineHeader}>
        <RefreshCw size={18} color={Colors.primary} />
        <Text style={styles.inlineTitle}>Switch Persona / Role</Text>
      </View>
      <Text style={styles.inlineDesc}>
        Instantly switch between Customer, Worker, and Admin accounts:
      </Text>

      <View style={styles.quickGrid}>
        {ROLES.map((r) => {
          const isCurrent = user?.role === r.role;
          const isLoading = loadingRole === r.role;

          return (
            <TouchableOpacity
              key={r.role}
              style={[
                styles.quickBtn,
                isCurrent && { backgroundColor: r.color, borderColor: r.color },
              ]}
              onPress={() => handleQuickSwitch(r.role, r.route)}
              disabled={isCurrent || loadingRole !== null}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isCurrent ? "#fff" : r.color}
                />
              ) : (
                r.icon(16, isCurrent ? "#FFFFFF" : r.color)
              )}
              <Text
                style={[
                  styles.quickBtnText,
                  isCurrent && { color: "#FFFFFF", fontWeight: "bold" },
                ]}
              >
                {r.name.split(" ")[0]} {isCurrent ? "✓" : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <RoleSwitcherModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.base,
  },
  modalContent: {
    maxHeight: "90%",
    flexGrow: 0,
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    width: "100%",
    maxWidth: 440,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.base,
  },
  modalTitle: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.round,
    backgroundColor: Colors.background,
  },
  roleList: {
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  roleInfo: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  roleName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.round,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  rolePersona: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleEmail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
    fontFamily: "monospace",
  },
  actionCol: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: Spacing.xs,
  },
  switchLink: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  signOutText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.error,
  },

  // Pill Button
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.round,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // Inline Card
  inlineCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  inlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  inlineTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  inlineDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  quickGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
});
