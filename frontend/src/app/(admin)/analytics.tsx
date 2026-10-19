import { ResponsiveGrid } from "@/components/common/ResponsiveLayout";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { BOOKING_STATUS_LABELS, Colors } from "@/constants";
import { workerService } from "@/services/api/bookingService";
import { analyticsService } from "@/services/api/otherServices";
import type { AnalyticsSummary, Worker } from "@/types";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
export default function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary>();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      Promise.all([
        analyticsService.getSummary(),
        workerService.getAllWorkers(),
      ])
        .then(([s, w]) => {
          setSummary(s);
          setWorkers(w);
        })
        .catch((e) => setError(e.message));
    }, []),
  );
  return (
    <MobileScreen title="Analytics">
      <Text style={s.heading}>Cooperative at a Glance</Text>
      <Text style={s.muted}>
        Live totals from your demo bookings and workers
      </Text>
      {!!error && <Text style={s.muted}>{error}</Text>}
      <View style={[s.card, { marginTop: 20 }]}>
        {[
          ["Completed bookings", summary?.completedBookings],
          ["Available workers", summary?.availableWorkers],
          ["Open complaints", summary?.pendingComplaints],
          ["Average rating", summary?.averageRating.toFixed(1)],
        ].map(([k, v]) => (
          <View key={k} style={s.between}>
            <Text style={s.muted}>{k}</Text>
            <Text style={s.label}>{v ?? "—"}</Text>
          </View>
        ))}
      </View>
      <ResponsiveGrid minItemWidth={400} maxColumns={2}>
        <View>
          <Text style={s.section}>Service Demand</Text>
          {summary?.serviceDemand.map((d) => (
            <View key={d.serviceId} style={{ marginBottom: 16, gap: 7 }}>
              <View style={s.between}>
                <Text style={s.label}>{d.serviceName}</Text>
                <Text style={s.muted}>{d.bookingCount} bookings</Text>
              </View>
              <View
                style={{
                  height: 9,
                  backgroundColor: "#ECF2FA",
                  borderRadius: 6,
                }}
              >
                <View
                  style={{
                    height: 9,
                    backgroundColor: Colors.primary,
                    borderRadius: 6,
                    width: `${(d.bookingCount / Math.max(...summary.serviceDemand.map((x) => x.bookingCount), 1)) * 100}%`,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
        <View>
          <Text style={s.section}>Booking Status</Text>
          <View style={s.card}>
            {summary?.bookingsByStatus.map((b) => (
              <View style={s.between} key={b.status}>
                <Text style={s.muted}>{BOOKING_STATUS_LABELS[b.status]}</Text>
                <Text style={s.label}>{b.count}</Text>
              </View>
            ))}
          </View>
          <Text style={s.section}>Work Distribution</Text>
          {workers.map((w) => (
            <View key={w.id} style={s.card}>
              <Text style={s.label}>{w.user.name}</Text>
              <Text style={s.muted}>
                {w.activeJobs} active · {w.completedJobs} completed
              </Text>
            </View>
          ))}
        </View>
      </ResponsiveGrid>
    </MobileScreen>
  );
}
