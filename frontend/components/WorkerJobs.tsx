import { ResponsiveGrid } from "@/components/common/ResponsiveLayout";
import { BOOKING_STATUS_LABELS, Colors } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService, workerService } from "@/services/api/bookingService";
import type { Booking, BookingStatus } from "@/types";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "./common/Button";
import { MobileScreen, mobileStyles as s } from "./common/MobileScreen";
import { Badge, EmptyState } from "./common/UIKit";
export function WorkerJobs({ requests = false }: { requests?: boolean }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [tab, setTab] = useState(requests ? "New" : "Upcoming");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const worker = user && (await workerService.getWorkerByUserId(user.id));
      setJobs(worker ? await bookingService.getWorkerBookings(worker.id) : []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function action(id: string, status: BookingStatus | "reject") {
    setBusy(id);
    setError("");
    try {
      if (status === "reject") await bookingService.rejectJob(id);
      else await bookingService.updateBookingStatus(id, status);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  const shown = jobs.filter((b) =>
    requests
      ? b.status === (tab === "Accepted" ? "accepted" : "worker_assigned")
      : tab === "Completed"
        ? b.status === "completed"
        : tab === "Active"
          ? b.status === "in_progress"
          : ["accepted", "worker_assigned"].includes(b.status),
  );
  return (
    <MobileScreen title={requests ? "Job Requests" : "My Jobs"} back>
      <View style={s.chips}>
        {(requests
          ? ["New", "Accepted"]
          : ["Upcoming", "Active", "Completed"]
        ).map((t) => (
          <Pressable
            accessibilityRole="button"
            key={t}
            style={[s.chip, tab === t && s.selected]}
            onPress={() => setTab(t)}
          >
            <Text
              style={{
                color: tab === t ? "#fff" : Colors.textSecondary,
                fontSize: 12,
              }}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: Colors.error, marginBottom: 15 }}
        >
          {error}
        </Text>
      )}
      {loading ? (
        <Text style={s.muted}>Loading jobs…</Text>
      ) : shown.length ? (
        <ResponsiveGrid minItemWidth={340} maxColumns={2}>
          {shown.map((b) => (
            <View key={b.id} style={s.card}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/booking/${b.id}`)}
              >
                <Text style={s.label}>
                  {b.service?.name} · {b.description}
                </Text>
                <Text style={s.muted}>{b.location}</Text>
                <Text style={s.muted}>
                  {b.preferredDate} · {b.preferredTime}
                </Text>
              </Pressable>
              <Badge
                label={BOOKING_STATUS_LABELS[b.status]}
                variant={b.status === "completed" ? "success" : "primary"}
              />
              <View style={s.row}>
                {b.status === "worker_assigned" ? (
                  <>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Reject"
                        variant="danger"
                        disabled={busy === b.id}
                        onPress={() => action(b.id, "reject")}
                        fullWidth
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Accept"
                        variant="secondary"
                        loading={busy === b.id}
                        onPress={() => action(b.id, "accepted")}
                        fullWidth
                      />
                    </View>
                  </>
                ) : b.status === "accepted" ? (
                  <Button
                    label="Start Job"
                    loading={busy === b.id}
                    onPress={() => action(b.id, "in_progress")}
                    fullWidth
                  />
                ) : b.status === "in_progress" ? (
                  <Button
                    label="Complete Job"
                    loading={busy === b.id}
                    onPress={() => action(b.id, "completed")}
                    fullWidth
                  />
                ) : (
                  <Button
                    label="View Details"
                    variant="outline"
                    onPress={() => router.push(`/booking/${b.id}`)}
                    fullWidth
                  />
                )}
              </View>
            </View>
          ))}
        </ResponsiveGrid>
      ) : (
        <EmptyState
          title="You're all caught up"
          message="Jobs in this category will appear here."
          actionLabel="Refresh"
          onAction={load}
        />
      )}
    </MobileScreen>
  );
}
