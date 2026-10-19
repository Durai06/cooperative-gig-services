import {
  ResponsiveGrid,
  PageHeading,
} from "@/components/common/ResponsiveLayout";
import { WorkerPortrait } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { Badge } from "@/components/common/UIKit";
import { Colors } from "@/constants";
import { workerService } from "@/services/api/bookingService";
import { analyticsService } from "@/services/api/otherServices";
import type { AnalyticsSummary, Worker } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  MessageSquareWarning,
  Settings,
  Users,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
export default function AdminDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary>();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [name, setName] = useState("Your Cooperative");
  const [alerts, setAlerts] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [sum, all, raw] = await Promise.all([
        analyticsService.getSummary(),
        workerService.getAllWorkers(),
        AsyncStorage.getItem("coopconnect.settings"),
      ]);
      setSummary(sum);
      setWorkers(all);
      if (raw) {
        const v = JSON.parse(raw);
        setName(v.name);
        setAlerts(v.notifications);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <MobileScreen
      brand
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={{ padding: 10 }}
          onPress={() => router.push("/(admin)/settings")}
        >
          <Settings color="#fff" size={22} />
        </Pressable>
      }
    >
      <PageHeading>Admin Dashboard</PageHeading>
      <Text style={[s.muted, { marginBottom: 20 }]}>{name}</Text>
      {!!error && <Text style={s.muted}>{error}</Text>}
      <ResponsiveGrid minItemWidth={148} maxColumns={4} gap={12}>
        {[
          ["Total Workers", summary?.totalWorkers, "#EEE9FF", "#7551E4"],
          ["Verified", summary?.verifiedWorkers, "#E5F7EE", "#149553"],
          ["Pending", summary?.pendingVerifications, "#FFF1E8", "#E97F36"],
          ["Active Bookings", summary?.activeBookings, "#E8F3FF", "#1683EF"],
        ].map(([title, value, bg, color]) => (
          <View
            key={title}
            style={{
              width: "100%",
              flexGrow: 1,
              backgroundColor: bg as string,
              borderRadius: 12,
              padding: 16,
              gap: 5,
            }}
          >
            <Text
              style={{
                color: color as string,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: 27,
                fontWeight: "800",
                color: color as string,
              }}
            >
              {value ?? "—"}
            </Text>
          </View>
        ))}
      </ResponsiveGrid>
      <ResponsiveGrid
        minItemWidth={420}
        maxColumns={2}
        style={{ marginTop: 24 }}
      >
        <View>
          <View style={[s.between, { marginTop: 24, marginBottom: 14 }]}>
            <Text style={s.label}>Bookings Overview</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(admin)/analytics")}
            >
              <Text style={{ color: Colors.primary, fontSize: 12 }}>
                View analytics
              </Text>
            </Pressable>
          </View>
          <View
            style={[
              s.card,
              {
                flexDirection: "row",
                alignItems: "flex-end",
                minHeight: 165,
                gap: 6,
              },
            ]}
          >
            {summary?.bookingsByStatus.map((item, i) => (
              <View
                key={item.status}
                style={{ flex: 1, minWidth: 0, alignItems: "center", gap: 7 }}
              >
                <Text style={{ fontSize: 11, color: Colors.primary }}>
                  {item.count}
                </Text>
                <View
                  style={{
                    height: Math.max(
                      6,
                      (item.count /
                        Math.max(
                          ...summary.bookingsByStatus.map((x) => x.count),
                          1,
                        )) *
                        70,
                    ),
                    width: "80%",
                    backgroundColor: i === 3 ? "#096BFF" : "#8FBFFF",
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    color: Colors.textSecondary,
                    textAlign: "center",
                    alignSelf: "stretch",
                    minHeight: 28,
                  }}
                >
                  {
                    [
                      "Pending",
                      "Assigned",
                      "Accepted",
                      "Active",
                      "Done",
                      "Cancelled",
                    ][i]
                  }
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View>
          <Text style={s.section}>Manage Your Cooperative</Text>
          {[
            { title: "Manage Workers", path: "/(admin)/workers", Icon: Users },
            {
              title: "Booking Management",
              path: "/(admin)/bookings",
              Icon: CalendarDays,
            },
            {
              title: "Complaints",
              path: "/(admin)/complaints",
              Icon: MessageSquareWarning,
            },
            { title: "Analytics", path: "/(admin)/analytics", Icon: BarChart3 },
          ].map(({ title, path, Icon }) => (
            <Pressable
              key={path}
              accessibilityRole="button"
              style={[s.card, s.row]}
              onPress={() => router.push(path as "/(admin)/workers")}
            >
              <Icon size={21} color={Colors.primary} />
              <Text style={[s.label, { flex: 1 }]}>{title}</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </ResponsiveGrid>
      {alerts && workers.some((w) => w.verificationStatus === "pending") && (
        <>
          <Text style={s.section}>Pending Verification</Text>
          {workers
            .filter((w) => w.verificationStatus === "pending")
            .map((w) => (
              <Pressable
                accessibilityRole="button"
                key={w.id}
                style={[s.card, s.row]}
                onPress={() =>
                  router.push(`/(admin)/verification?workerId=${w.id}`)
                }
              >
                <WorkerPortrait size={48} />
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{w.user.name}</Text>
                  <Badge label="Review profile" variant="warning" />
                </View>
                <ChevronRight size={18} />
              </Pressable>
            ))}
        </>
      )}
      <Button
        label="Settings"
        variant="outline"
        fullWidth
        onPress={() => router.push("/(admin)/settings")}
      />
    </MobileScreen>
  );
}
