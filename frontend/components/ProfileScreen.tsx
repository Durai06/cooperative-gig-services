// ============================================================
// Sevai One – Unified Multi-Sector Profile Hub
// Premium, role-adaptive profile experience for:
// 1. Citizen / Customer Sector
// 2. Cooperative Gig Worker / Tradesperson Sector
// 3. Cooperative Society Administrator Sector
// ============================================================

import { WorkerPortrait } from "./common/Brand";
import { Button } from "./common/Button";
import { Input } from "./common/Input";
import { MobileScreen } from "./common/MobileScreen";
import { Badge, Divider } from "./common/UIKit";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/api/authService";
import { bookingService, workerService } from "@/services/api/bookingService";
import { analyticsService } from "@/services/api/otherServices";
import type { Booking, Worker } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import {
  AlertCircle,
  Award,
  Bell,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  Globe2,
  HeartHandshake,
  IndianRupee,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function ProfileScreen({ forcedRole }: { forcedRole?: "customer" | "worker" | "admin" }) {
  const { user, updateUser, logout } = useAuth();
  const activeRole = forcedRole ?? user?.role ?? "customer";

  // Editable user fields
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [emergencyContact, setEmergencyContact] = useState("+91 98765 43210");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sector Data
  const [worker, setWorker] = useState<Worker | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [adminStats, setAdminStats] = useState<{ totalWorkers: number; totalBookings: number; complaints: number }>({
    totalWorkers: 0,
    totalBookings: 0,
    complaints: 0,
  });

  // Operational toggles
  const [availability, setAvailability] = useState(true);
  const [emergencyAvailable, setEmergencyAvailable] = useState(true);
  const [serviceRadius, setServiceRadius] = useState<number>(15);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsUpdates, setSmsUpdates] = useState(true);
  const [language, setLanguage] = useState("English");

  // Load Sector Data
  const loadSectorData = useCallback(async () => {
    if (!user) return;
    try {
      if (activeRole === "worker") {
        const w = await workerService.getWorkerByUserId(user.id);
        if (w) {
          setWorker(w);
          setAvailability(w.availability);
          setEmergencyAvailable(w.emergencyAvailable ?? true);
          setServiceRadius(w.serviceRadiusKm ?? 15);
          const wBookings = await bookingService.getWorkerBookings(w.id);
          setBookings(wBookings);
        }
      } else if (activeRole === "customer") {
        const cBookings = await bookingService.getCustomerBookings(user.id);
        setBookings(cBookings);
      } else if (activeRole === "admin") {
        const [allW, allB, summary] = await Promise.all([
          workerService.getAllWorkers().catch(() => []),
          bookingService.getAllBookings().catch(() => []),
          analyticsService.getSummary().catch(() => null),
        ]);
        setAdminStats({
          totalWorkers: allW.length,
          totalBookings: allB.length,
          complaints: summary?.pendingComplaints ?? 3,
        });
      }

      // Load cached preferences
      const cachedLang = await AsyncStorage.getItem("coop_preferred_lang");
      if (cachedLang) setLanguage(cachedLang);
      const cachedContact = await AsyncStorage.getItem("coop_emergency_contact");
      if (cachedContact) setEmergencyContact(cachedContact);
    } catch (e: any) {
      console.warn("Error loading sector profile data:", e?.message);
    }
  }, [user, activeRole]);

  useFocusEffect(
    useCallback(() => {
      void loadSectorData();
    }, [loadSectorData]),
  );

  // Synchronize form when user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setAddress(user.address ?? "");
    }
  }, [user]);

  // Save profile edits
  async function handleSaveProfile() {
    if (!user) return;
    if (name.trim().length < 2) {
      setFeedbackMessage({ text: "Please enter a valid full name.", type: "error" });
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setFeedbackMessage({ text: "Please enter a valid 10-digit mobile number.", type: "error" });
      return;
    }
    if (address.trim().length < 5) {
      setFeedbackMessage({ text: "Please enter a complete address (minimum 5 characters).", type: "error" });
      return;
    }

    setSaving(true);
    setFeedbackMessage(null);
    try {
      const updated = await authService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      updateUser(updated);
      await AsyncStorage.setItem("coop_emergency_contact", emergencyContact.trim());
      setEditing(false);
      setFeedbackMessage({ text: "Profile details updated successfully.", type: "success" });
    } catch {
      setFeedbackMessage({ text: "Could not save profile to server. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  // Toggle worker availability
  async function handleToggleAvailability(val: boolean) {
    setAvailability(val);
    if (!worker) return;
    try {
      await workerService.toggleAvailability(worker.id);
      setFeedbackMessage({
        text: val ? "You are now ONLINE for gig dispatch." : "You are now OFFLINE.",
        type: "success",
      });
    } catch {
      // rollback on error
      setAvailability(!val);
    }
  }

  // Toggle emergency on-call
  async function handleToggleEmergency(val: boolean) {
    setEmergencyAvailable(val);
    if (!worker) return;
    try {
      await workerService.saveSchedule(worker.id, {
        serviceRadiusKm: serviceRadius,
        emergencyAvailable: val,
      });
    } catch {
      setEmergencyAvailable(!val);
    }
  }

  // Change service radius
  async function handleChangeRadius(km: number) {
    setServiceRadius(km);
    if (!worker) return;
    try {
      await workerService.saveSchedule(worker.id, {
        serviceRadiusKm: km,
        emergencyAvailable,
      });
    } catch (e) {
      console.warn("Could not save radius:", e);
    }
  }

  // Language selection
  async function handleSelectLanguage(lang: string) {
    setLanguage(lang);
    await AsyncStorage.setItem("coop_preferred_lang", lang);
  }

  // Sign out confirmation
  function handleSignOut() {
    const performLogout = async () => {
      try {
        await logout();
        router.replace("/roles");
      } catch (e) {
        console.error("Sign out error:", e);
      }
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Are you sure you want to sign out of Sevai One?")) {
        void performLogout();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out of Sevai One?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: performLogout },
      ]);
    }
  }

  // Calculate booking statistics
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const activeCount = bookings.filter((b) => ["pending", "accepted", "in_progress", "worker_assigned"].includes(b.status)).length;
  const totalBookingsCount = bookings.length;

  // Sector Theme Configuration
  const sectorConfig = {
    customer: {
      title: "Citizen Member Profile",
      sectorPill: "Consumer Sector",
      roleLabel: "Verified Citizen Member",
      accentColor: "#0874FF",
      icon: UserRoundIcon,
    },
    worker: {
      title: "Tradesperson & Worker Profile",
      sectorPill: "Labour & Gig Worker Sector",
      roleLabel: "Cooperative Tradesperson",
      accentColor: "#16A34A",
      icon: Wrench,
    },
    admin: {
      title: "Cooperative Society Admin Profile",
      sectorPill: "Cooperative Administration Sector",
      roleLabel: "Society Administrator",
      accentColor: "#8061F5",
      icon: Building,
    },
  }[activeRole] ?? {
    title: "User Profile",
    sectorPill: "General Sector",
    roleLabel: "Member",
    accentColor: Colors.primary,
    icon: UserRoundIcon,
  };

  return (
    <MobileScreen title={sectorConfig.title} back={activeRole === "admin"}>
      {/* ── 1. Hero Profile Card ── */}
      <View style={[styles.heroCard, { borderTopColor: sectorConfig.accentColor }]}>
        <View style={styles.heroRow}>
          <View style={styles.avatarWrap}>
            {activeRole === "worker" ? (
              <>
                <WorkerPortrait size={76} />
                <View style={[styles.onlineBadgeDot, { backgroundColor: availability ? "#22C55E" : "#94A3B8" }]} />
              </>
            ) : (
              <View
                style={[
                  styles.customerAvatar,
                  { backgroundColor: activeRole === "admin" ? "#EDE9FE" : "#E0F2FE" },
                ]}
              >
                <Text
                  style={[
                    styles.customerInitials,
                    { color: activeRole === "admin" ? "#6D28D9" : "#0284C7" },
                  ]}
                >
                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "SO"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.heroDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.heroName} numberOfLines={1}>
                {user?.name || "Sevai One User"}
              </Text>
              <ShieldCheck size={20} color={sectorConfig.accentColor} />
            </View>

            <Text style={styles.heroEmail} numberOfLines={1}>
              {user?.email}
            </Text>

            <View style={styles.badgeRow}>
              <Badge
                label={sectorConfig.roleLabel}
                variant={activeRole === "worker" ? "success" : activeRole === "admin" ? "info" : "primary"}
                size="sm"
              />
              {activeRole === "worker" && worker && (
                <Badge
                  label={worker.verificationStatus === "verified" ? "Verified" : "Pending Verification"}
                  variant={worker.verificationStatus === "verified" ? "success" : "warning"}
                  size="sm"
                />
              )}
            </View>
          </View>
        </View>

        {/* Cooperative Affiliation Banner */}
        <View style={styles.coopBanner}>
          <Building size={15} color={Colors.textSecondary} />
          <Text style={styles.coopBannerText} numberOfLines={1}>
            {activeRole === "worker"
              ? worker?.cooperative?.name || "Kerala Labour & Skilled Workers Cooperative (Reg. #4029)"
              : activeRole === "admin"
                ? "Kerala Labour & Artisan Cooperative Society Ltd. (Society Reg. #4029)"
                : "Sevai One Consumer Protection & Fair Tariff Network"}
          </Text>
        </View>

        {/* Edit Button Header */}
        {!editing ? (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setEditing(true);
              setFeedbackMessage(null);
            }}
            activeOpacity={0.8}
          >
            <Edit3 size={15} color={Colors.primary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              setEditing(false);
              setName(user?.name ?? "");
              setPhone(user?.phone ?? "");
              setAddress(user?.address ?? "");
            }}
            activeOpacity={0.8}
          >
            <X size={15} color={Colors.textSecondary} />
            <Text style={styles.cancelBtnText}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Feedback Message ── */}
      {feedbackMessage && (
        <View
          style={[
            styles.feedbackBanner,
            feedbackMessage.type === "success" ? styles.feedbackSuccess : styles.feedbackError,
          ]}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 size={16} color="#15803D" />
          ) : (
            <AlertCircle size={16} color="#B91C1C" />
          )}
          <Text
            style={[
              styles.feedbackText,
              feedbackMessage.type === "success" ? styles.feedbackTextSuccess : styles.feedbackTextError,
            ]}
          >
            {feedbackMessage.text}
          </Text>
        </View>
      )}

      {/* ── 2. Sector Quick Metrics Grid ── */}
      <View style={styles.metricsContainer}>
        {activeRole === "customer" && (
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#E0F2FE" }]}>
                <Briefcase size={18} color="#0284C7" />
              </View>
              <Text style={styles.metricNumber}>{totalBookingsCount}</Text>
              <Text style={styles.metricLabel}>Total Bookings</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#DCFCE7" }]}>
                <CheckCircle2 size={18} color="#16A34A" />
              </View>
              <Text style={styles.metricNumber}>{completedCount}</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#FEF3C7" }]}>
                <Clock size={18} color="#D97706" />
              </View>
              <Text style={styles.metricNumber}>{activeCount}</Text>
              <Text style={styles.metricLabel}>In Progress</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#F3E8FF" }]}>
                <Sparkles size={18} color="#7C3AED" />
              </View>
              <Text style={styles.metricNumber}>₹1,420</Text>
              <Text style={styles.metricLabel}>Fair Savings</Text>
            </View>
          </View>
        )}

        {activeRole === "worker" && (
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#FEF3C7" }]}>
                <Star size={18} color="#D97706" />
              </View>
              <Text style={styles.metricNumber}>
                {worker ? `★ ${worker.rating.toFixed(1)}` : "★ 4.9"}
              </Text>
              <Text style={styles.metricLabel}>
                {worker ? `${worker.totalRatings} Reviews` : "Customer Rating"}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#DCFCE7" }]}>
                <Wrench size={18} color="#16A34A" />
              </View>
              <Text style={styles.metricNumber}>
                {worker?.completedJobs ?? completedCount}
              </Text>
              <Text style={styles.metricLabel}>Jobs Done</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#E0F2FE" }]}>
                <IndianRupee size={18} color="#0284C7" />
              </View>
              <Text style={styles.metricNumber}>
                ₹{worker?.earnings ? worker.earnings.toLocaleString("en-IN") : "18,450"}
              </Text>
              <Text style={styles.metricLabel}>Net Earnings</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#F3E8FF" }]}>
                <Award size={18} color="#7C3AED" />
              </View>
              <Text style={styles.metricNumber}>98.5%</Text>
              <Text style={styles.metricLabel}>Fairness Score</Text>
            </View>
          </View>
        )}

        {activeRole === "admin" && (
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#DCFCE7" }]}>
                <Users size={18} color="#16A34A" />
              </View>
              <Text style={styles.metricNumber}>{adminStats.totalWorkers || 14}</Text>
              <Text style={styles.metricLabel}>Workers</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#E0F2FE" }]}>
                <Briefcase size={18} color="#0284C7" />
              </View>
              <Text style={styles.metricNumber}>{adminStats.totalBookings || 28}</Text>
              <Text style={styles.metricLabel}>Bookings</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#FEF3C7" }]}>
                <AlertCircle size={18} color="#D97706" />
              </View>
              <Text style={styles.metricNumber}>{adminStats.complaints}</Text>
              <Text style={styles.metricLabel}>Complaints</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "#F3E8FF" }]}>
                <ShieldCheck size={18} color="#7C3AED" />
              </View>
              <Text style={styles.metricNumber}>99.4%</Text>
              <Text style={styles.metricLabel}>Trust Index</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── 3. Sector-Specific Specialty Cards ── */}

      {/* WORKER SECTOR: Operational Status & Dispatch Controls */}
      {activeRole === "worker" && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Zap size={18} color="#16A34A" />
            <Text style={styles.sectionTitle}>Operational Availability & Radius</Text>
          </View>

          {/* Availability Toggle */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Gig Duty Status</Text>
              <Text style={styles.toggleSubtitle}>
                {availability
                  ? "You are ONLINE and receiving nearby gig job dispatches."
                  : "You are OFFLINE. Customers cannot assign new bookings."}
              </Text>
            </View>
            <Switch
              value={availability}
              onValueChange={handleToggleAvailability}
              thumbColor={availability ? "#16A34A" : "#F4F4F5"}
              trackColor={{ false: "#D1D5DB", true: "#BBF7D0" }}
            />
          </View>

          <Divider style={{ marginVertical: Spacing.sm }} />

          {/* Emergency 24/7 Availability */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.toggleTitle}>24/7 Emergency Dispatch</Text>
                <Badge label="1.5x Premium" variant="warning" size="sm" />
              </View>
              <Text style={styles.toggleSubtitle}>
                Accept priority emergency dispatches (burst pipes, major power cuts, lockouts).
              </Text>
            </View>
            <Switch
              value={emergencyAvailable}
              onValueChange={handleToggleEmergency}
              thumbColor={emergencyAvailable ? "#E11D48" : "#F4F4F5"}
              trackColor={{ false: "#D1D5DB", true: "#FECDD3" }}
            />
          </View>

          <Divider style={{ marginVertical: Spacing.sm }} />

          {/* Service Radius Selector */}
          <View style={{ marginTop: Spacing.xs }}>
            <View style={styles.betweenRow}>
              <Text style={styles.toggleTitle}>Service Distance Radius</Text>
              <Text style={[styles.toggleTitle, { color: Colors.primary }]}>{serviceRadius} km</Text>
            </View>
            <Text style={[styles.toggleSubtitle, { marginBottom: Spacing.sm }]}>
              Maximum distance you are willing to travel for on-site services.
            </Text>

            <View style={styles.radiusRow}>
              {[5, 10, 15, 25, 40].map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[styles.radiusChip, serviceRadius === km && styles.radiusChipActive]}
                  onPress={() => handleChangeRadius(km)}
                >
                  <Text style={[styles.radiusText, serviceRadius === km && styles.radiusTextActive]}>
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* WORKER SECTOR: Trade Skills & Certifications */}
      {activeRole === "worker" && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Wrench size={18} color="#16A34A" />
            <Text style={styles.sectionTitle}>Registered Trade Skills & Experience</Text>
          </View>

          <View style={styles.experienceBanner}>
            <Award size={20} color="#075985" />
            <View style={{ flex: 1 }}>
              <Text style={styles.expTitle}>
                {worker?.experience ? `${worker.experience} Years Field Experience` : "Professional Trade Master"}
              </Text>
              <Text style={styles.expSub}>Certified under National Skill Qualification Framework</Text>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md, marginBottom: Spacing.xs }]}>
            Verified Trade Sectors:
          </Text>
          <View style={styles.skillsWrap}>
            {worker?.skills && worker.skills.length > 0 ? (
              worker.skills.map((s) => (
                <View key={s.id} style={styles.skillChip}>
                  <CheckCircle2 size={13} color="#16A34A" />
                  <Text style={styles.skillChipText}>{s.serviceName}</Text>
                </View>
              ))
            ) : (
              <>
                <View style={styles.skillChip}>
                  <CheckCircle2 size={13} color="#16A34A" />
                  <Text style={styles.skillChipText}>⚡ Electrical Installation & Repair</Text>
                </View>
                <View style={styles.skillChip}>
                  <CheckCircle2 size={13} color="#16A34A" />
                  <Text style={styles.skillChipText}>🔧 Plumbing & Sanitary</Text>
                </View>
                <View style={styles.skillChip}>
                  <CheckCircle2 size={13} color="#16A34A" />
                  <Text style={styles.skillChipText}>❄️ Air Conditioning & Refrigeration</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* WORKER SECTOR: Cooperative Welfare & Social Security Shield */}
      {activeRole === "worker" && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <HeartHandshake size={18} color="#16A34A" />
            <Text style={styles.sectionTitle}>Cooperative Welfare & Member Benefits</Text>
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIconWrap, { backgroundColor: "#DCFCE7" }]}>
              <ShieldCheck size={16} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Group Accidental & Health Cover (₹5,00,000)</Text>
              <Text style={styles.benefitSub}>Active coverage under Labour Welfare Board policy</Text>
            </View>
            <Badge label="Active" variant="success" size="sm" />
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIconWrap, { backgroundColor: "#E0F2FE" }]}>
              <IndianRupee size={16} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Cooperative Annual Dividend Pool</Text>
              <Text style={styles.benefitSub}>Member equity bonus based on completed gigs</Text>
            </View>
            <Badge label="Enrolled" variant="primary" size="sm" />
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIconWrap, { backgroundColor: "#FEF3C7" }]}>
              <Wrench size={16} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Trade Tool & Safety Equipment Subsidy</Text>
              <Text style={styles.benefitSub}>Annual safety gear reimbursement grant</Text>
            </View>
            <Badge label="Eligible" variant="warning" size="sm" />
          </View>
        </View>
      )}

      {/* CUSTOMER SECTOR: Fair Pricing & Citizen Guarantees */}
      {activeRole === "customer" && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ShieldCheck size={18} color="#0874FF" />
            <Text style={styles.sectionTitle}>Cooperative Citizen Guarantees</Text>
          </View>

          <View style={styles.guaranteeRow}>
            <CheckCircle2 size={16} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.guaranteeTitle}>Zero Surge Pricing Standard</Text>
              <Text style={styles.guaranteeSub}>
                Statutory standardized hourly & unit tariffs. No artificial price surges during rains or peak demand.
              </Text>
            </View>
          </View>

          <View style={styles.guaranteeRow}>
            <CheckCircle2 size={16} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.guaranteeTitle}>Certified Police & Society Background Verified</Text>
              <Text style={styles.guaranteeSub}>
                Every service professional is identity-checked and certified by the local Labour Cooperative.
              </Text>
            </View>
          </View>

          <View style={styles.guaranteeRow}>
            <CheckCircle2 size={16} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.guaranteeTitle}>Institutional Grievance Redressal</Text>
              <Text style={styles.guaranteeSub}>
                Fair mediation board ensures resolutions or full refunds within 24 hours.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ADMIN SECTOR: Society Oversight & Governance */}
      {activeRole === "admin" && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Building size={18} color="#8061F5" />
            <Text style={styles.sectionTitle}>Society Administration Credentials</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Society Name:</Text>
            <Text style={styles.detailValue}>Sevai One Labour & Artisan Cooperative</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Registration Act:</Text>
            <Text style={styles.detailValue}>State Cooperative Societies Act #4029</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Headquarters:</Text>
            <Text style={styles.detailValue}>Cooperative Bhavan, Regional Centre</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Official Helpline:</Text>
            <Text style={styles.detailValue}>+91 484 234 5678</Text>
          </View>

          <Divider style={{ marginVertical: Spacing.md }} />

          <View style={styles.quickNavRow}>
            <TouchableOpacity
              style={[styles.quickNavBtn, { borderColor: "#8061F5" }]}
              onPress={() => router.push("/(admin)/workers")}
            >
              <Users size={16} color="#8061F5" />
              <Text style={[styles.quickNavText, { color: "#8061F5" }]}>Worker Verifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickNavBtn, { borderColor: "#0874FF" }]}
              onPress={() => router.push("/(admin)/complaints")}
            >
              <AlertCircle size={16} color="#0874FF" />
              <Text style={[styles.quickNavText, { color: "#0874FF" }]}>Dispute Desk</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── 4. Personal Information & Interactive Profile Form ── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Shield size={18} color={sectorConfig.accentColor} />
          <Text style={styles.sectionTitle}>Personal & Contact Information</Text>
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Your full legal name"
              leftIcon={<UserRoundIcon size={16} color={Colors.textSecondary} />}
            />
            <Input
              label="Mobile Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 XXXXX XXXXX"
              leftIcon={<Phone size={16} color={Colors.textSecondary} />}
            />
            <Input
              label="Registered Email"
              value={user?.email ?? ""}
              editable={false}
              leftIcon={<Mail size={16} color={Colors.textDisabled} />}
              hint="Email address is tied to your account authentication"
            />
            <Input
              label={activeRole === "worker" ? "Base Service Location / Workshop" : "Home / Service Address"}
              value={address}
              onChangeText={setAddress}
              multiline
              placeholder="Door No, Street, Ward / Area, Landmark"
              leftIcon={<MapPin size={16} color={Colors.textSecondary} />}
            />
            <Input
              label="Emergency Contact Number"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              keyboardType="phone-pad"
              placeholder="+91 Emergency Phone"
              leftIcon={<Phone size={16} color={Colors.textSecondary} />}
              hint="Notified in case of job hazards or urgent verification requests"
            />

            <View style={styles.formActions}>
              <Button
                label={saving ? "Saving Changes..." : "Save Profile Details"}
                fullWidth
                onPress={handleSaveProfile}
                disabled={saving}
              />
              <Button
                label="Cancel"
                variant="ghost"
                fullWidth
                onPress={() => {
                  setEditing(false);
                  setName(user?.name ?? "");
                  setPhone(user?.phone ?? "");
                  setAddress(user?.address ?? "");
                }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.readOnlyList}>
            <View style={styles.readOnlyItem}>
              <View style={styles.readOnlyIcon}>
                <UserRoundIcon size={16} color={Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Full Legal Name</Text>
                <Text style={styles.fieldValue}>{user?.name || "Not provided"}</Text>
              </View>
            </View>

            <View style={styles.readOnlyItem}>
              <View style={styles.readOnlyIcon}>
                <Phone size={16} color={Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Mobile Phone</Text>
                <Text style={styles.fieldValue}>{user?.phone || "Not provided"}</Text>
              </View>
            </View>

            <View style={styles.readOnlyItem}>
              <View style={styles.readOnlyIcon}>
                <Mail size={16} color={Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Registered Email</Text>
                <Text style={styles.fieldValue}>{user?.email || "Not provided"}</Text>
              </View>
            </View>

            <View style={styles.readOnlyItem}>
              <View style={styles.readOnlyIcon}>
                <MapPin size={16} color={Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  {activeRole === "worker" ? "Operating Base Location" : "Service Address"}
                </Text>
                <Text style={styles.fieldValue}>{user?.address || "No address on file"}</Text>
              </View>
            </View>

            <View style={styles.readOnlyItem}>
              <View style={styles.readOnlyIcon}>
                <HeartHandshake size={16} color={Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Emergency Helpline Contact</Text>
                <Text style={styles.fieldValue}>{emergencyContact}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── 5. App Preferences & Localization ── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Globe2 size={18} color={sectorConfig.accentColor} />
          <Text style={styles.sectionTitle}>Language & Dispatch Notifications</Text>
        </View>

        <Text style={styles.toggleTitle}>Preferred Regional Language</Text>
        <Text style={[styles.toggleSubtitle, { marginBottom: Spacing.sm }]}>
          App interface, SMS dispatch alerts & voice prompts
        </Text>

        <View style={styles.langRow}>
          {["English", "தமிழ்", "മലയാളം", "हिंदी"].map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.langChip, language === l && styles.langChipActive]}
              onPress={() => handleSelectLanguage(l)}
            >
              <Text style={[styles.langText, language === l && styles.langTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Divider style={{ marginVertical: Spacing.md }} />

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Push Notifications</Text>
            <Text style={styles.toggleSubtitle}>Instant booking requests and dispatch alerts</Text>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            thumbColor={pushNotifications ? Colors.primary : "#F4F4F5"}
            trackColor={{ false: "#D1D5DB", true: Colors.primaryLight }}
          />
        </View>

        <View style={[styles.toggleRow, { marginTop: Spacing.sm }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>SMS Booking Summaries</Text>
            <Text style={styles.toggleSubtitle}>Receive offline SMS when network connectivity is low</Text>
          </View>
          <Switch
            value={smsUpdates}
            onValueChange={setSmsUpdates}
            thumbColor={smsUpdates ? Colors.primary : "#F4F4F5"}
            trackColor={{ false: "#D1D5DB", true: Colors.primaryLight }}
          />
        </View>
      </View>

      {/* ── 6. Sector Navigation Shortcuts ── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Sparkles size={18} color={sectorConfig.accentColor} />
          <Text style={styles.sectionTitle}>Sector Shortcuts & Quick Actions</Text>
        </View>

        {activeRole === "customer" && (
          <>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push("/(customer)/bookings")}
            >
              <Briefcase size={18} color={Colors.primary} />
              <Text style={styles.navRowText}>My Service Bookings</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push("/(customer)/services")}
            >
              <Wrench size={18} color={Colors.primary} />
              <Text style={styles.navRowText}>Explore Trade Sectors & Catalog</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push("/complaint/list")}
            >
              <FileText size={18} color={Colors.primary} />
              <Text style={styles.navRowText}>My Grievances & Mediation Desk</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push("/(customer)/notifications")}
            >
              <Bell size={18} color={Colors.primary} />
              <Text style={styles.navRowText}>Notifications & Society Notices</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}

        {activeRole === "worker" && (
          <>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push("/(worker)/availability")}
            >
              <Calendar size={18} color="#16A34A" />
              <Text style={styles.navRowText}>Weekly Schedule & Shift Planner</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push("/(worker)/earnings")}
            >
              <IndianRupee size={18} color="#16A34A" />
              <Text style={styles.navRowText}>Earnings, Invoices & Cooperative Payouts</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push("/(worker)/jobs")}
            >
              <Briefcase size={18} color="#16A34A" />
              <Text style={styles.navRowText}>Assigned Gig Work Orders</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}

        {activeRole === "admin" && (
          <>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push("/(admin)/workers")}
            >
              <Users size={18} color="#8061F5" />
              <Text style={styles.navRowText}>Worker Verification Roster</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push("/(admin)/bookings")}
            >
              <Briefcase size={18} color="#8061F5" />
              <Text style={styles.navRowText}>Society Bookings & Dispatch Audit</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push("/(admin)/analytics")}
            >
              <Award size={18} color="#8061F5" />
              <Text style={styles.navRowText}>Performance & Wage Equity Reports</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── 7. Sign Out & Platform Credentials ── */}
      <View style={styles.footerSection}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Sign Out from Sevai One</Text>
        </TouchableOpacity>

        <Text style={styles.versionNote}>
          Sevai One Cooperative Gig Platform · v1.0.0
        </Text>
        <Text style={styles.versionSubNote}>
          Cooperative Fair-Trade Certified · Direct Worker Equity
        </Text>
      </View>
    </MobileScreen>
  );
}

// User Icon helper
function UserRoundIcon({ size = 20, color = "#0874FF" }: { size?: number; color?: string }) {
  return <Users size={size} color={color} />;
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderTopWidth: 4,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarWrap: {
    position: "relative",
  },
  onlineBadgeDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  customerAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  customerInitials: {
    fontSize: 24,
    fontWeight: Typography.fontWeight.extraBold,
  },
  heroDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  heroEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  coopBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  coopBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.md,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginTop: Spacing.md,
  },
  editBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.md,
    backgroundColor: "#F1F5F9",
    marginTop: Spacing.md,
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.base,
  },
  feedbackSuccess: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  feedbackError: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  feedbackText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  feedbackTextSuccess: {
    color: "#15803D",
  },
  feedbackTextError: {
    color: "#B91C1C",
  },
  metricsContainer: {
    marginBottom: Spacing.base,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.md,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  metricNumber: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 4,
  },
  toggleTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  toggleSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  betweenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  radiusRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  radiusChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: Colors.primary,
  },
  radiusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  radiusTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  experienceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0F9FF",
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  expTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: "#0369A1",
  },
  expSub: {
    fontSize: Typography.fontSize.xs,
    color: "#0284C7",
    marginTop: 1,
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  skillChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: "#166534",
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  benefitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  benefitSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  guaranteeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
  },
  guaranteeTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  guaranteeSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "right",
  },
  quickNavRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  quickNavBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: "#F8FAFC",
  },
  quickNavText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  editForm: {
    gap: Spacing.sm,
  },
  formActions: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  readOnlyList: {
    gap: Spacing.md,
  },
  readOnlyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  readOnlyIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  langRow: {
    flexDirection: "row",
    gap: 8,
  },
  langChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  langChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: Colors.primary,
  },
  langText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  langTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 12,
  },
  navRowText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  footerSection: {
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    width: "100%",
    marginBottom: Spacing.md,
  },
  logoutBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: "#DC2626",
  },
  versionNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  versionSubNote: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
