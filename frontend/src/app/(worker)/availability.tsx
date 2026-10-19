import { Alert } from "@/components/common/Feedback";
import { useAuth } from "@/contexts/AuthContext";
import { workerService } from "@/services/api/bookingService";
import React, { useEffect, useState } from "react";
// ============================================================
// CoopConnect – Worker Availability & Schedule Screen
// Weekly time slot management and service radius configuration.
// ============================================================

import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Card, Divider } from "@/components/common/UIKit";
import { Colors, Radius, Spacing, Typography } from "@/constants";
import { CalendarClock } from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PageFrame } from "@/components/common/ResponsiveLayout";

interface DaySchedule {
  day: string;
  enabled: boolean;
  shift: string;
}

const INITIAL_SCHEDULE: DaySchedule[] = [
  { day: "Monday", enabled: true, shift: "08:00 AM – 06:00 PM" },
  { day: "Tuesday", enabled: true, shift: "08:00 AM – 06:00 PM" },
  { day: "Wednesday", enabled: true, shift: "08:00 AM – 06:00 PM" },
  { day: "Thursday", enabled: true, shift: "08:00 AM – 06:00 PM" },
  { day: "Friday", enabled: true, shift: "08:00 AM – 06:00 PM" },
  { day: "Saturday", enabled: true, shift: "09:00 AM – 04:00 PM" },
  { day: "Sunday", enabled: false, shift: "Weekly Off" },
];

const RADIUS_OPTIONS = ["5 km", "10 km", "15 km", "25 km"];

export default function WorkerAvailabilityScreen() {
  const { user } = useAuth();
  const [workerId, setWorkerId] = useState("");
  useEffect(() => {
    if (user)
      workerService
        .getWorkerByUserId(user.id)
        .then((w) => {
          if (w) {
            setWorkerId(w.id);
            if (w.schedule) setSchedule(w.schedule);
            if (w.serviceRadiusKm) setSelectedRadius(`${w.serviceRadiusKm} km`);
            if (w.emergencyAvailable !== undefined)
              setEmergencyAvailable(w.emergencyAvailable);
          }
        })
        .catch(() => Alert.alert("Error", "Could not load availability."));
  }, [user]);
  const [schedule, setSchedule] = useState<DaySchedule[]>(INITIAL_SCHEDULE);
  const [selectedRadius, setSelectedRadius] = useState("15 km");
  const [emergencyAvailable, setEmergencyAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggleDay = (index: number) => {
    const updated = [...schedule];
    updated[index] = {
      ...updated[index],
      enabled: !updated[index].enabled,
      shift:
        updated[index].shift === "Weekly Off"
          ? "08:00 AM – 06:00 PM"
          : updated[index].shift,
    };
    setSchedule(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await workerService.saveSchedule(workerId, {
        schedule,
        serviceRadiusKm: parseInt(selectedRadius, 10),
        emergencyAvailable,
      });
      Alert.alert(
        "Schedule Saved",
        "Your working days, emergency preference and service area have been saved.",
      );
    } catch (e) {
      Alert.alert("Could not save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageFrame edges={["top", "left", "right"]} style={styles.safe}>
      <ScreenHeader title="Work Schedule" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cooperative Notice */}
        <View style={styles.infoBox}>
          <CalendarClock size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Setting your consistent working hours helps the society guarantee
            fair job distribution and prevents assignment conflicts.
          </Text>
        </View>

        {/* Emergency Calls Toggle */}
        <Card style={styles.emergencyCard}>
          <View style={styles.emergencyRow}>
            <View style={styles.emergencyTextCol}>
              <Text style={styles.emergencyTitle}>
                Accept Emergency Dispatches
              </Text>
              <Text style={styles.emergencyDesc}>
                Receive high-priority emergency requests (e.g. electrical
                faults, burst pipes) when you are available.
              </Text>
            </View>
            <Switch
              value={emergencyAvailable}
              onValueChange={setEmergencyAvailable}
              trackColor={{ false: Colors.border, true: Colors.success }}
              thumbColor={Colors.surface}
            />
          </View>
        </Card>

        {/* Weekly Shifts */}
        <Text style={styles.sectionTitle}>Weekly Working Days</Text>
        <Card style={styles.scheduleCard}>
          {schedule.map((item, index) => (
            <View key={item.day}>
              <View style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <Text
                    style={[
                      styles.dayName,
                      !item.enabled && styles.dayDisabled,
                    ]}
                  >
                    {item.day}
                  </Text>
                  <Text style={styles.shiftHours}>
                    {item.enabled ? item.shift : "Off Duty"}
                  </Text>
                </View>

                <Switch
                  value={item.enabled}
                  onValueChange={() => toggleDay(index)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.surface}
                />
              </View>
              {index < schedule.length - 1 && (
                <Divider style={styles.dayDivider} />
              )}
            </View>
          ))}
        </Card>

        {/* Service Radius */}
        <Text style={styles.sectionTitle}>Maximum Service Radius</Text>
        <Card style={styles.radiusCard}>
          <Text style={styles.radiusDesc}>
            Select the maximum travel distance from your registered society
            location:
          </Text>
          <View style={styles.radiusOptions}>
            {RADIUS_OPTIONS.map((rad) => {
              const active = selectedRadius === rad;
              return (
                <TouchableOpacity
                  key={rad}
                  style={[styles.radiusBtn, active && styles.radiusBtnActive]}
                  onPress={() => setSelectedRadius(rad)}
                >
                  <Text
                    style={[
                      styles.radiusText,
                      active && styles.radiusTextActive,
                    ]}
                  >
                    {rad}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Save CTA */}
        <Button
          title="Save Availability Preferences"
          variant="primary"
          size="lg"
          loading={saving}
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </ScrollView>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight + "20",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  infoText: {
    ...Typography.caption,
    color: Colors.primaryDark,
    flex: 1,
    lineHeight: 18,
  },
  emergencyCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  emergencyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emergencyTextCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  emergencyTitle: {
    ...Typography.subtitle2,
    color: Colors.textPrimary,
  },
  emergencyDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    ...Typography.subtitle1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  scheduleCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    ...Typography.subtitle2,
    color: Colors.textPrimary,
  },
  dayDisabled: {
    color: Colors.textDisabled,
  },
  shiftHours: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dayDivider: {
    marginVertical: 4,
  },
  radiusCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  radiusDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  radiusOptions: {
    flexWrap: "wrap",
    rowGap: 8,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  radiusBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.surfaceSecondary,
  },
  radiusBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + "25",
  },
  radiusText: {
    ...Typography.subtitle2,
    color: Colors.textSecondary,
  },
  radiusTextActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  saveBtn: {
    marginTop: Spacing.xs,
  },
});
