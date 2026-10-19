import { ResponsiveGrid } from "@/components/common/ResponsiveLayout";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { Badge } from "@/components/common/UIKit";
import { Colors } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService, workerService } from "@/services/api/bookingService";
import type { Booking, Worker } from "@/types";
import { useFocusEffect } from "expo-router";
import { TrendingUp } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
export default function Earnings() {
  const { user } = useAuth();
  const [worker, setWorker] = useState<Worker>();
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [period, setPeriod] = useState("All Time");
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const w = user && (await workerService.getWorkerByUserId(user.id));
          if (w) {
            setWorker(w);
            setJobs(
              (await bookingService.getWorkerBookings(w.id)).filter(
                (b) => b.status === "completed",
              ),
            );
          }
        } catch (e) {
          setError((e as Error).message);
        }
      })();
    }, [user]),
  );
  const now = new Date();
  const shown = jobs.filter(
    (b) =>
      period === "All Time" ||
      (new Date(b.updatedAt).getMonth() === now.getMonth() &&
        new Date(b.updatedAt).getFullYear() === now.getFullYear()),
  );
  const total =
    period === "All Time"
      ? (worker?.earnings ?? 0)
      : shown.reduce((sum, b) => sum + (b.service?.basePrice ?? 0), 0);
  return (
    <MobileScreen title="Earnings">
      <View
        style={[
          s.card,
          { backgroundColor: Colors.primary, borderWidth: 0, padding: 24 },
        ]}
      >
        <Text style={{ color: "#DDEAFF" }}>Total Earnings</Text>
        <View style={s.between}>
          <Text style={{ fontSize: 36, fontWeight: "800", color: "#fff" }}>
            ₹{total.toLocaleString("en-IN")}
          </Text>
          <TrendingUp size={48} color="#78E3AA" />
        </View>
        <Text style={{ color: "#DDEAFF", fontSize: 12 }}>
          Completed work · {period.toLowerCase()}
        </Text>
      </View>
      <View style={s.chips}>
        {["This Month", "All Time"].map((p) => (
          <Pressable
            accessibilityRole="button"
            key={p}
            onPress={() => setPeriod(p)}
            style={[s.chip, p === period && s.selected]}
          >
            <Text
              style={{ color: p === period ? "#fff" : Colors.textSecondary }}
            >
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.muted}>{error}</Text>
      <Text style={s.section}>Completed Services</Text>
      <ResponsiveGrid minItemWidth={340} maxColumns={2}>
        {shown.map((b) => (
          <View key={b.id} style={s.card}>
            <View style={s.between}>
              <Text style={s.label}>{b.service?.name}</Text>
              <Text style={[s.label, { color: Colors.secondary }]}>
                ₹{b.service?.basePrice ?? 0}
              </Text>
            </View>
            <View style={s.between}>
              <Text style={s.muted}>{b.preferredDate}</Text>
              <Badge label="Completed" variant="success" />
            </View>
          </View>
        ))}
      </ResponsiveGrid>
      {!shown.length && (
        <Text style={s.muted}>No completed jobs for this period.</Text>
      )}
      <Text style={[s.muted, { marginTop: 20 }]}>
        Demo earnings are recorded at the service starting price when a job is
        completed. This app does not process payments.
      </Text>
    </MobileScreen>
  );
}
