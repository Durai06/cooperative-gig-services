import { ResponsiveGrid } from "@/components/common/ResponsiveLayout";
import { WorkerPortrait } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { Badge, EmptyState, StarRating } from "@/components/common/UIKit";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService, workerService } from "@/services/api/bookingService";
import type { Booking, WorkerMatch } from "@/types";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
export default function AvailableWorkers() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking>();
  const [matches, setMatches] = useState<WorkerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const b = await bookingService.getBookingById(bookingId);
      setBooking(b);
      if (b) setMatches(await workerService.matchWorkersForBooking(b));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function select(id: string) {
    setBusy(id);
    try {
      await bookingService.assignWorker(bookingId, id);
      router.replace(
        user?.role === "admin"
          ? `/booking/${bookingId}`
          : `/booking/confirmation?bookingId=${bookingId}`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <MobileScreen title="Available Workers" back>
      <Text style={[s.muted, { marginBottom: 20 }]}>
        {booking?.service?.name} · Verified local professionals
      </Text>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: "#C62638", marginBottom: 14 }}
        >
          {error}
        </Text>
      )}
      {loading ? (
        <Text style={s.muted}>Finding available workers…</Text>
      ) : matches.length ? (
        <ResponsiveGrid minItemWidth={340} maxColumns={2}>
          {matches.map((match, i) => (
            <View key={match.worker.id} style={[s.card, s.row]}>
              <WorkerPortrait size={72} variant={i} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={s.between}>
                  <Text style={[s.label, { flex: 1 }]}>
                    {match.worker.user.name}
                  </Text>
                  {match.distanceKm !== undefined && (
                    <Text style={[s.muted, { fontSize: 11 }]}>
                      {match.distanceKm} km
                    </Text>
                  )}
                </View>
                <StarRating rating={match.worker.rating} />
                <Text style={s.muted}>
                  {match.worker.experience} years experience
                </Text>
                <View style={s.between}>
                  <Badge label="Available" variant="success" />
                  <Button
                    label="Select"
                    size="sm"
                    loading={busy === match.worker.id}
                    disabled={!!busy}
                    onPress={() => select(match.worker.id)}
                  />
                </View>
                <Button
                  label="View Profile"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push(`/worker/${match.worker.id}`)}
                />
              </View>
            </View>
          ))}
        </ResponsiveGrid>
      ) : (
        <EmptyState
          title="No workers available"
          message="Try another service or check back later. Your booking is saved."
          actionLabel="Refresh"
          onAction={load}
        />
      )}
    </MobileScreen>
  );
}
