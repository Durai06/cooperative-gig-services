import * as Location from "expo-location";
import { Alert } from "@/components/common/Feedback";
// ============================================================
// CoopConnect – Create Booking Screen
// ============================================================

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Colors, Radius, Spacing, Typography } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/api/bookingService";
import { catalogueService } from "@/services/api/otherServices";
import type { Service } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FileText, MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
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
import { z } from "zod";

const schema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  description: z
    .string()
    .min(10, "Please describe the problem (min 10 characters)"),
  location: z.string().min(5, "Enter a service address"),
  preferredDate: z.string().min(1, "Select a preferred date"),
  preferredTime: z.string().min(1, "Select a preferred time"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

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

export default function CreateBookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    service?: string;
    emergency?: string;
  }>();

  const [emergency, setEmergency] = useState(params.emergency === "true");
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  }>();
  const [locating, setLocating] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceId: "",
      description: "",
      location: user?.address ?? "",
      preferredDate: "",
      preferredTime: "",
      notes: "",
    },
  });

  useEffect(() => {
    let mounted = true;
    catalogueService
      .getServices()
      .then((list) => {
        if (!mounted) return;
        setServices(list);
        if (params.service) {
          const match = list.find(
            (s) => s.category === params.service || s.id === params.service,
          );
          if (match) {
            setValue("serviceId", match.id);
          }
        }
      })
      .catch((err) => {
        Alert.alert(
          "Backend Connection Error",
          "Could not load services from backend: " + (err.message ?? "Server offline"),
        );
      })
      .finally(() => {
        if (mounted) setLoadingServices(false);
      });
    return () => {
      mounted = false;
    };
  }, [params.service, setValue]);

  const selectedServiceId = watch("serviceId");
  const selectedTime = watch("preferredTime");

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
        ...coords,
      });
      router.replace(`/booking/workers?bookingId=${booking.id}`);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to create booking.");
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
      label:
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : d.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    };
  });

  async function useLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted")
        throw new Error(
          "Location permission was denied. You can enter your address manually.",
        );
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });
      if (Platform.OS !== "web") {
        const addresses = await Location.reverseGeocodeAsync(result.coords);
        const a = addresses[0];
        if (a)
          setValue(
            "location",
            [a.name, a.street, a.city, a.region, a.postalCode]
              .filter(Boolean)
              .join(", "),
          );
      }
    } catch (e) {
      Alert.alert("Location unavailable", (e as Error).message);
    } finally {
      setLocating(false);
    }
  }
  const selectedDate = watch("preferredDate");

  return (
    <PageFrame form style={styles.safe}>
      <ScreenHeader
        title={
          selectedServiceId
            ? `Book ${services.find((s) => s.id === selectedServiceId)?.name ?? "Service"}`
            : "Book a Service"
        }
        showBack
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Service Selection */}
          <Text style={styles.fieldLabel}>Select Service</Text>
          {loadingServices ? (
            <Text style={[styles.fieldLabel, { color: Colors.textSecondary, fontWeight: "normal" }]}>
              Loading available services from backend...
            </Text>
          ) : (
            <View
              style={[
                styles.serviceScroll,
                { flexDirection: "row", flexWrap: "wrap", gap: 8 },
              ]}
            >
              {services.map((svc) => {
                const sel = selectedServiceId === svc.id;
                return (
                  <TouchableOpacity
                    key={svc.id}
                    style={[
                      styles.serviceChip,
                      sel && styles.serviceChipSelected,
                    ]}
                    onPress={() => setValue("serviceId", svc.id)}
                  >
                    <Text
                      style={[
                        styles.serviceChipText,
                        sel && styles.serviceChipTextSelected,
                      ]}
                    >
                      {svc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {errors.serviceId && (
            <Text style={styles.errorText}>{errors.serviceId.message}</Text>
          )}

          {/* Emergency Toggle */}
          <View
            style={[
              styles.emergencyToggle,
              emergency && styles.emergencyToggleActive,
            ]}
          >
            <View>
              <Text
                style={[
                  styles.emergencyTitle,
                  emergency && styles.emergencyTitleActive,
                ]}
              >
                🚨 Emergency Service
              </Text>
              <Text
                style={[
                  styles.emergencySubtitle,
                  emergency && styles.emergencySubtitleActive,
                ]}
              >
                Request priority assistance
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
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
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
            )}
          />

          {/* Location */}
          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, onBlur, value } }) => (
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
            )}
          />

          <Button
            label={coords ? "Location added · Update" : "Use Current Location"}
            loading={locating}
            variant="ghost"
            onPress={useLocation}
            fullWidth
          />
          {/* Date */}
          <Text style={styles.fieldLabel}>Preferred Date</Text>
          <View
            style={[
              styles.dateScroll,
              { flexDirection: "row", flexWrap: "wrap", gap: 8 },
            ]}
          >
            {dateOptions.map((d) => {
              const sel = selectedDate === d.value;
              return (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.dateChip, sel && styles.dateChipSelected]}
                  onPress={() => setValue("preferredDate", d.value)}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      sel && styles.dateChipTextSelected,
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.preferredDate && (
            <Text style={styles.errorText}>{errors.preferredDate.message}</Text>
          )}

          {/* Time */}
          <Text style={styles.fieldLabel}>Preferred Time</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((t) => {
              const sel = selectedTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, sel && styles.timeChipSelected]}
                  onPress={() => setValue("preferredTime", t)}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      sel && styles.timeChipTextSelected,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.preferredTime && (
            <Text style={styles.errorText}>{errors.preferredTime.message}</Text>
          )}

          {/* Notes */}
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Additional Notes (optional)"
                placeholder="Any specific requirements…"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={2}
              />
            )}
          />

          <Button
            label="Find Available Workers"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  serviceScroll: { marginBottom: Spacing.md },
  serviceChip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.cardBackground,
  },
  serviceChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  serviceChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  serviceChipTextSelected: { color: Colors.primary },
  emergencyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  emergencyToggleActive: {
    borderColor: Colors.emergency,
    backgroundColor: Colors.emergencyLight,
  },
  emergencyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  emergencyTitleActive: { color: Colors.emergency },
  emergencySubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emergencySubtitleActive: { color: Colors.emergency },
  dateScroll: { marginBottom: Spacing.md },
  dateChip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.cardBackground,
  },
  dateChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  dateChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  dateChipTextSelected: { color: Colors.textInverse },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  timeChip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  timeChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  timeChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  timeChipTextSelected: { color: Colors.textInverse },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: -8,
    marginBottom: Spacing.md,
  },
});
