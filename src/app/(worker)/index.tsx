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
import { Badge, LoadingSpinner } from "@/components/common/UIKit";
import { Colors } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService, workerService } from "@/services/api/bookingService";
import type { Booking, Worker } from "@/types";
import { router, useFocusEffect } from "expo-router";
import {
  CalendarCheck,
  ChevronRight,
  Settings,
  Wallet,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
export default function WorkerDashboard() {
  const { user } = useAuth();
  const [worker, setWorker] = useState<Worker>();
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const w = user && (await workerService.getWorkerByUserId(user.id));
          if (active && w) {
            setWorker(w);
            setJobs(await bookingService.getWorkerBookings(w.id));
          }
        } catch (e) {
          setError((e as Error).message);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [user]),
  );
  const requests = jobs.filter((b) => b.status === "worker_assigned");
  const active = jobs.filter((b) =>
    ["accepted", "in_progress"].includes(b.status),
  );
  async function toggle() {
    if (!worker) return;
    setBusy(true);
    try {
      setWorker({ ...(await workerService.toggleAvailability(worker.id)) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <MobileScreen title="Dashboard">
        <LoadingSpinner label="Loading your dashboard…" />
      </MobileScreen>
    );
  return (
    <MobileScreen brand>
      <View style={[s.row, { marginBottom: 20 }]}>
        <WorkerPortrait size={64} />
        <View style={{ flex: 1 }}>
          <PageHeading>Hello, {user?.name.split(" ")[0]}</PageHeading>
          <Text style={s.muted}>Keep up the good work!</Text>
        </View>
      </View>
      <View style={[s.between, s.card]}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <Text style={s.label}>
            {worker?.availability ? "Available for work" : "Currently offline"}
          </Text>
          <Text style={s.muted}>Your availability is visible to customers</Text>
        </View>
        <Switch
          accessibilityLabel="Available for work"
          value={worker?.availability ?? false}
          disabled={busy}
          onValueChange={toggle}
          trackColor={{ true: Colors.secondary, false: Colors.border }}
        />
      </View>
      {!!error && <Text style={{ color: Colors.error }}>{error}</Text>}
      {worker?.verificationStatus !== "verified" && (
        <View style={s.card}>
          <Badge label="Verification pending" variant="warning" />
          <Text style={s.muted}>
            Your cooperative must verify your profile before you can receive
            jobs.
          </Text>
        </View>
      )}
      <ResponsiveGrid minItemWidth={148} maxColumns={4} gap={12}>
        {[
          ["Job Requests", requests.length, "/(worker)/requests", "#EAF2FF"],
          ["Active Jobs", active.length, "/(worker)/jobs", "#FFF4E7"],
          [
            "Completed",
            worker?.completedJobs ?? 0,
            "/(worker)/jobs",
            "#E9F7ED",
          ],
          [
            "Total Earnings",
            `₹${(worker?.earnings ?? 0).toLocaleString("en-IN")}`,
            "/(worker)/earnings",
            "#E7F7EF",
          ],
        ].map(([label, value, path, bg]) => (
          <Pressable
            accessibilityRole="button"
            key={label}
            onPress={() => router.push(path as "/(worker)/jobs")}
            style={{
              width: "100%",
              flexGrow: 1,
              backgroundColor: bg as string,
              borderRadius: 12,
              padding: 16,
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 23,
                fontWeight: "800",
                color: Colors.primaryDark,
              }}
            >
              {value}
            </Text>
            <Text style={s.muted}>{label}</Text>
          </Pressable>
        ))}
      </ResponsiveGrid>
      <Text style={s.section}>Your Workday</Text>
      <ResponsiveGrid minItemWidth={280} maxColumns={3}>
        {[
          {
            label: "New Job Requests",
            desc: `${requests.length} requests waiting for you`,
            path: "/(worker)/requests",
            Icon: CalendarCheck,
          },
          {
            label: "My Jobs",
            desc: "Upcoming, active and completed work",
            path: "/(worker)/jobs",
            Icon: Wallet,
          },
          {
            label: "Manage Availability",
            desc: "Set your working days and service area",
            path: "/(worker)/availability",
            Icon: Settings,
          },
        ].map(({ label, desc, path, Icon }) => (
          <Pressable
            accessibilityRole="button"
            key={label}
            style={[s.card, s.row]}
            onPress={() => router.push(path as "/(worker)/jobs")}
          >
            <Icon size={23} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{label}</Text>
              <Text style={s.muted}>{desc}</Text>
            </View>
            <ChevronRight size={17} color={Colors.textSecondary} />
          </Pressable>
        ))}
      </ResponsiveGrid>
      <Button
        label="View My Profile"
        variant="outline"
        fullWidth
        onPress={() => router.push("/(worker)/profile")}
      />
    </MobileScreen>
  );
}
