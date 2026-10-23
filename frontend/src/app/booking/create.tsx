import * as Location from "expo-location";
import { Alert } from "@/components/common/Feedback";
// ============================================================
// Sevai One – 4-Step Booking Wizard
// Step 1: Service Selection
// Step 2: Work Details
// Step 3: Address & Schedule
// Step 4: Review & Price Breakdown Confirmation
// ============================================================

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ServiceIcon } from "@/components/common/ServiceIcon";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/api/bookingService";
import { catalogueService } from "@/services/api/otherServices";
import type { Service } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Info,
  MapPin,
  ShieldCheck,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PageFrame } from "@/components/common/ResponsiveLayout";

const WIZARD_STEPS = [
  { step: 1, title: "Service", subtitle: "Select service" },
  { step: 2, title: "Details", subtitle: "Describe work" },
  { step: 3, title: "Schedule", subtitle: "Time & Place" },
  { step: 4, title: "Review", subtitle: "Confirm & Pay" },
];

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const MANDATORY_BOOKING_CHARGE = 100;

export default function CreateBookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    service?: string;
    emergency?: string;
  }>();

  // Wizard Step State (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State Preserved across back/next navigation
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [isEmergency, setIsEmergency] = useState<boolean>(params.emergency === "true");
  const [description, setDescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [location, setLocation] = useState<string>(user?.address || "");
  const [preferredDate, setPreferredDate] = useState<string>("");
  const [preferredTime, setPreferredTime] = useState<string>("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | undefined>();

  // Validation errors for each step
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading & Submitting
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  // Load services
  useEffect(() => {
    let mounted = true;
    catalogueService
      .getServices()
      .then((list) => {
        if (!mounted) return;
        setServices(list);
        if (params.service) {
          const match = list.find(
            (s) => s.category === params.service || s.id === params.service
          );
          if (match) {
            setSelectedServiceId(match.id);
          }
        }
      })
      .catch((err) => {
        Alert.alert(
          "Connection Warning",
          "Could not load service catalog. " + (err?.message || "Please try again.")
        );
      })
      .finally(() => {
        if (mounted) setLoadingServices(false);
      });
    return () => {
      mounted = false;
    };
  }, [params.service]);

  // Selected Service object
  const activeService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId);
  }, [services, selectedServiceId]);

  // Available Dates: Today + Next 7 days
  const dateOptions = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      return {
        label: isToday
          ? "Today"
          : isTomorrow
            ? "Tomorrow"
            : d.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              }),
        value: dateStr,
      };
    });
  }, []);

  // Set default date and time if empty
  useEffect(() => {
    if (!preferredDate && dateOptions.length > 0) {
      setPreferredDate(dateOptions[0].value);
    }
    if (!preferredTime) {
      setPreferredTime("10:00");
    }
  }, [dateOptions, preferredDate, preferredTime]);

  // Step 1 Validation
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!selectedServiceId) {
      errs.service = "Please select a service category to proceed.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!description.trim() || description.trim().length < 10) {
      errs.description = "Please describe the work needed (minimum 10 characters).";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!location.trim() || location.trim().length < 5) {
      errs.location = "Please enter a valid service address.";
    }
    if (!preferredDate) {
      errs.date = "Please select a service date.";
    }
    if (!preferredTime) {
      errs.time = "Please select a preferred time slot.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step Navigation Handlers
  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setErrors({});
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  // Auto-detect GPS location
  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        throw new Error("Location permission denied. Please enter address manually.");
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (Platform.OS !== "web") {
        const addresses = await Location.reverseGeocodeAsync(pos.coords);
        if (addresses.length > 0) {
          const a = addresses[0];
          const full = [a.name, a.street, a.district, a.city, a.postalCode]
            .filter(Boolean)
            .join(", ");
          if (full) setLocation(full);
        }
      }
    } catch (e: any) {
      Alert.alert("Location Notice", e?.message || "Could not retrieve GPS coordinates.");
    } finally {
      setLocating(false);
    }
  };

  // Final Submission
  const handleSubmitBooking = async () => {
    if (!user) {
      Alert.alert("Authentication Required", "Please log in to confirm booking.");
      return;
    }
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    setSubmitting(true);
    try {
      const newBooking = await bookingService.createBooking(user.id, {
        serviceId: selectedServiceId,
        description: description.trim(),
        location: location.trim(),
        preferredDate,
        preferredTime,
        emergency: isEmergency,
        notes: notes.trim() || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      router.replace(`/booking/workers?bookingId=${newBooking.id}`);
    } catch (err: any) {
      Alert.alert("Booking Error", err?.message || "Failed to create booking. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const serviceFee = activeService?.basePrice || 350;
  const totalAmount = serviceFee + MANDATORY_BOOKING_CHARGE;

  return (
    <PageFrame form style={styles.safe}>
      <ScreenHeader
        title={
          currentStep === 1
            ? "Step 1: Choose Service"
            : currentStep === 2
              ? "Step 2: Work Details"
              : currentStep === 3
                ? "Step 3: Schedule & Address"
                : "Step 4: Review & Confirm"
        }
        showBack
        onBack={handleBack}
      />

      {/* ── Wizard Progress Stepper Bar ── */}
      <View style={styles.stepperContainer}>
        {WIZARD_STEPS.map((s, idx) => {
          const isDone = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          return (
            <React.Fragment key={s.step}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepBadge,
                    isDone && styles.stepBadgeDone,
                    isCurrent && styles.stepBadgeCurrent,
                  ]}
                >
                  {isDone ? (
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.stepBadgeText,
                        isCurrent && styles.stepBadgeTextCurrent,
                      ]}
                    >
                      {s.step}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepTitle,
                    isCurrent && styles.stepTitleCurrent,
                    isDone && styles.stepTitleDone,
                  ]}
                >
                  {s.title}
                </Text>
              </View>
              {idx < WIZARD_STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepDivider,
                    currentStep > s.step && styles.stepDividerDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: SERVICE SELECTION                                        */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Which service do you need?</Text>
              <Text style={styles.stepSubheading}>
                Select a verified cooperative trade category below.
              </Text>

              {loadingServices ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.centerText}>Loading service catalogue...</Text>
                </View>
              ) : (
                <View style={styles.servicesGrid}>
                  {services.map((svc) => {
                    const isSelected = selectedServiceId === svc.id;
                    return (
                      <TouchableOpacity
                        key={svc.id}
                        style={[
                          styles.serviceSelectionCard,
                          isSelected && styles.serviceSelectionCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedServiceId(svc.id);
                          setErrors({});
                        }}
                        activeOpacity={0.8}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <ServiceIcon category={svc.category} size={46} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.serviceSelectionTitle}>{svc.name}</Text>
                          <Text style={styles.serviceSelectionTariff}>
                            Tariff: ₹{svc.basePrice}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.selectedCheckWrap}>
                            <CheckCircle2 size={20} color={Colors.primary} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {errors.service && (
                <View style={styles.errorNotice}>
                  <AlertCircle size={16} color={Colors.error} />
                  <Text style={styles.errorNoticeText}>{errors.service}</Text>
                </View>
              )}

              {/* Emergency Service Option */}
              <View
                style={[
                  styles.emergencyCard,
                  isEmergency && styles.emergencyCardActive,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Zap size={18} color={isEmergency ? Colors.emergency : "#D97706"} />
                    <Text
                      style={[
                        styles.emergencyTitle,
                        isEmergency && { color: Colors.emergency },
                      ]}
                    >
                      Urgent / Emergency Booking
                    </Text>
                  </View>
                  <Text style={styles.emergencyText}>
                    Dispatches available emergency workers for urgent repairs.
                  </Text>
                </View>
                <Switch
                  value={isEmergency}
                  onValueChange={setIsEmergency}
                  trackColor={{ false: Colors.border, true: Colors.emergency }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <Button
                label="Continue to Work Details"
                onPress={handleNext}
                size="lg"
                fullWidth
                style={{ marginTop: Spacing.xl }}
              />
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: WORK DETAILS                                             */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Describe the work needed</Text>
              <Text style={styles.stepSubheading}>
                Provide details to help your artisan bring appropriate tools and parts.
              </Text>

              {activeService && (
                <View style={styles.selectedServicePill}>
                  <ServiceIcon category={activeService.category} size={28} />
                  <Text style={styles.selectedServicePillText}>{activeService.name}</Text>
                  <Text style={styles.selectedServicePillTariff}>From ₹{activeService.basePrice}</Text>
                </View>
              )}

              <Input
                label="Problem or Task Description *"
                placeholder="e.g. Master bedroom wall socket sparked and stopped working. Need new switch and wiring check."
                value={description}
                onChangeText={(val) => {
                  setDescription(val);
                  if (errors.description) setErrors({});
                }}
                error={errors.description}
                multiline
                numberOfLines={4}
                leftIcon={<FileText size={18} color={Colors.textSecondary} />}
              />

              <Input
                label="Special Instructions / Access Notes (Optional)"
                placeholder="e.g. Please ring doorbell 3B; parking available in front visitor slot."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />

              <View style={styles.wizardActionRow}>
                <Button
                  label="Back"
                  variant="outline"
                  onPress={handleBack}
                  size="lg"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Next: Schedule"
                  onPress={handleNext}
                  size="lg"
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: ADDRESS & SCHEDULE                                       */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>When & where do you need service?</Text>
              <Text style={styles.stepSubheading}>
                Specify your location and preferred appointment time.
              </Text>

              {/* Service Address */}
              <Input
                label="Service Location Address *"
                placeholder="Flat / House No., Street, Landmark, City"
                value={location}
                onChangeText={(val) => {
                  setLocation(val);
                  if (errors.location) setErrors({});
                }}
                error={errors.location}
                multiline
                numberOfLines={2}
                leftIcon={<MapPin size={18} color={Colors.textSecondary} />}
              />

              <Button
                label={coords ? "GPS Location Captured · Refresh" : "Use GPS Current Location"}
                loading={locating}
                variant="ghost"
                onPress={handleUseCurrentLocation}
                fullWidth
                style={{ marginTop: -Spacing.sm, marginBottom: Spacing.md }}
              />

              {/* Date Selection */}
              <Text style={styles.fieldLabel}>Select Preferred Date *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScroll}
              >
                {dateOptions.map((d) => {
                  const isSel = preferredDate === d.value;
                  return (
                    <TouchableOpacity
                      key={d.value}
                      style={[styles.dateChip, isSel && styles.dateChipSelected]}
                      onPress={() => {
                        setPreferredDate(d.value);
                        if (errors.date) setErrors({});
                      }}
                    >
                      <Text style={[styles.dateChipText, isSel && styles.dateChipTextSelected]}>
                        {d.label}
                      </Text>
                      <Text style={[styles.dateChipSub, isSel && styles.dateChipSubSelected]}>
                        {d.value.slice(5)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {errors.date && <Text style={styles.fieldErrorText}>{errors.date}</Text>}

              {/* Time Slots */}
              <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
                Select Preferred Time Slot *
              </Text>
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((t) => {
                  const isSel = preferredTime === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timeChip, isSel && styles.timeChipSelected]}
                      onPress={() => {
                        setPreferredTime(t);
                        if (errors.time) setErrors({});
                      }}
                    >
                      <Clock size={12} color={isSel ? "#FFFFFF" : Colors.textSecondary} />
                      <Text style={[styles.timeChipText, isSel && styles.timeChipTextSelected]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.time && <Text style={styles.fieldErrorText}>{errors.time}</Text>}

              <View style={styles.wizardActionRow}>
                <Button
                  label="Back"
                  variant="outline"
                  onPress={handleBack}
                  size="lg"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Next: Review"
                  onPress={handleNext}
                  size="lg"
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 4: REVIEW & CONFIRM                                         */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Review & Confirm Booking</Text>
              <Text style={styles.stepSubheading}>
                Please check all booking details before confirming.
              </Text>

              {/* Service & Details Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  {activeService && (
                    <ServiceIcon category={activeService.category} size={42} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryServiceName}>
                      {activeService?.name || "Professional Service"}
                    </Text>
                    {isEmergency && (
                      <View style={styles.summaryEmergencyBadge}>
                        <Zap size={11} color="#DC2626" />
                        <Text style={styles.summaryEmergencyText}>URGENT EMERGENCY</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryMetaItem}>
                  <FileText size={15} color={Colors.textSecondary} />
                  <Text style={styles.summaryMetaText}>{description}</Text>
                </View>

                {notes ? (
                  <View style={styles.summaryMetaItem}>
                    <Info size={15} color={Colors.textSecondary} />
                    <Text style={styles.summaryMetaSubtext}>Note: {notes}</Text>
                  </View>
                ) : null}

                <View style={styles.summaryDivider} />

                <View style={styles.summaryMetaItem}>
                  <MapPin size={15} color={Colors.primary} />
                  <Text style={styles.summaryMetaText}>{location}</Text>
                </View>

                <View style={styles.summaryMetaItem}>
                  <Calendar size={15} color={Colors.primary} />
                  <Text style={styles.summaryMetaText}>
                    {preferredDate} at {preferredTime}
                  </Text>
                </View>
              </View>

              {/* Transparent Financial Price Breakdown */}
              <View style={styles.priceSummaryCard}>
                <Text style={styles.priceSummaryTitle}>Payment Breakdown</Text>

                <View style={styles.priceSummaryRow}>
                  <Text style={styles.priceSummaryLabel}>
                    Base Service Tariff ({activeService?.name})
                  </Text>
                  <Text style={styles.priceSummaryValue}>₹{serviceFee.toFixed(2)}</Text>
                </View>

                <View style={styles.priceSummaryRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={styles.priceSummaryLabel}>Mandatory Booking Charge</Text>
                    <ShieldCheck size={13} color="#059669" />
                  </View>
                  <Text style={styles.priceSummaryValue}>
                    ₹{MANDATORY_BOOKING_CHARGE.toFixed(2)}
                  </Text>
                </View>

                <Text style={styles.chargeExplainer}>
                  Cooperative platform guarantee fee supports verified worker insurance and fair wage arbitration.
                </Text>

                <View style={[styles.priceSummaryRow, styles.priceSummaryTotalRow]}>
                  <Text style={styles.priceSummaryTotalLabel}>Total Amount Payable</Text>
                  <Text style={styles.priceSummaryTotalValue}>₹{totalAmount.toFixed(2)}</Text>
                </View>

                <View style={styles.paymentMethodNotice}>
                  <CreditCard size={16} color="#0284C7" />
                  <Text style={styles.paymentMethodText}>
                    Pay on Service Completion (Cash or UPI directly to your cooperative artisan).
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.wizardActionRow}>
                <Button
                  label="Back"
                  variant="outline"
                  onPress={handleBack}
                  size="lg"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Confirm Booking"
                  onPress={handleSubmitBooking}
                  loading={submitting}
                  size="lg"
                  style={{ flex: 2 }}
                />
              </View>
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

  // Stepper Header
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepBadgeDone: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
  },
  stepBadgeTextCurrent: {
    color: "#FFFFFF",
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  stepTitleCurrent: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  stepTitleDone: {
    color: "#059669",
  },
  stepDivider: {
    flex: 1,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 4,
    marginBottom: 14,
  },
  stepDividerDone: {
    backgroundColor: "#059669",
  },

  // Step Content Common
  stepContent: {
    gap: Spacing.md,
  },
  stepHeading: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  stepSubheading: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },

  // Step 1: Services Grid
  servicesGrid: {
    gap: 10,
  },
  serviceSelectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 12,
    ...Shadows.sm,
  },
  serviceSelectionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF",
  },
  serviceSelectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  serviceSelectionTariff: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.semiBold,
    marginTop: 2,
  },
  selectedCheckWrap: {
    padding: 2,
  },
  errorNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: Radius.md,
    gap: 8,
  },
  errorNoticeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    fontWeight: Typography.fontWeight.medium,
  },
  emergencyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    gap: 12,
    marginTop: Spacing.xs,
  },
  emergencyCardActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  emergencyTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: "#B45309",
  },
  emergencyText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Step 2
  selectedServicePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 10,
    marginBottom: Spacing.sm,
  },
  selectedServicePillText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
    flex: 1,
  },
  selectedServicePillTariff: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },

  // Step 3
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  fieldErrorText: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 4,
  },
  dateScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    minWidth: 76,
  },
  dateChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  dateChipTextSelected: {
    color: "#FFFFFF",
  },
  dateChipSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateChipSubSelected: {
    color: "#E0F2FE",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  timeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  timeChipTextSelected: {
    color: "#FFFFFF",
  },

  // Step 4 Review
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
    gap: 10,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryServiceName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryEmergencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  summaryEmergencyText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: "#DC2626",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
  summaryMetaItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  summaryMetaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  summaryMetaSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  priceSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    gap: 8,
    ...Shadows.sm,
  },
  priceSummaryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  priceSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceSummaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  priceSummaryValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  chargeExplainer: {
    fontSize: 11,
    color: "#059669",
    lineHeight: 15,
    marginTop: 2,
  },
  priceSummaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    marginTop: 4,
  },
  priceSummaryTotalLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.extraBold,
    color: Colors.textPrimary,
  },
  priceSummaryTotalValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.extraBold,
    color: "#059669",
  },
  paymentMethodNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 10,
    borderRadius: Radius.md,
    gap: 8,
    marginTop: 6,
  },
  paymentMethodText: {
    fontSize: 11,
    color: "#0369A1",
    flex: 1,
    lineHeight: 16,
  },

  wizardActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: Spacing.xl,
  },
  centerBox: {
    padding: 30,
    alignItems: "center",
    gap: 10,
  },
  centerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
