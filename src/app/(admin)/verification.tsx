import { WorkerPortrait } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { Badge } from "@/components/common/UIKit";
import { workerService } from "@/services/api/bookingService";
import type { Worker } from "@/types";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
export default function Verification() {
  const { workerId } = useLocalSearchParams<{ workerId: string }>();
  const [worker, setWorker] = useState<Worker>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      workerService
        .getWorkerById(workerId)
        .then((data) => {
          if (data) setWorker(data);
          else setMessage("Worker not found.");
        })
        .catch((e) => setMessage(e.message));
    }, [workerId]),
  );
  async function update(status: "verified" | "rejected") {
    setBusy(true);
    try {
      setWorker(await workerService.updateVerificationStatus(workerId, status));
      setMessage(`Worker ${status}.`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <MobileScreen title="Worker Verification" back>
      {worker ? (
        <>
          <View style={{ alignItems: "center", gap: 14, marginVertical: 22 }}>
            <WorkerPortrait size={100} />
            <Text style={s.heading}>{worker.user.name}</Text>
            <Badge
              label={worker.verificationStatus}
              variant={
                worker.verificationStatus === "verified" ? "success" : "warning"
              }
            />
          </View>
          <View style={s.card}>
            {[
              ["Email", worker.user.email],
              ["Phone", worker.user.phone],
              ["Skills", worker.skills.map((x) => x.serviceName).join(", ")],
              ["Experience", `${worker.experience} years`],
              ["Cooperative", worker.cooperative?.name],
              ["Location", worker.location],
            ].map(([k, v]) => (
              <View key={k}>
                <Text style={s.muted}>{k}</Text>
                <Text style={s.label}>{v}</Text>
              </View>
            ))}
          </View>
          <Text style={[s.muted, { marginBottom: 18 }]}>
            Verify the worker&apos;s identity and qualifications with your
            cooperative before approving. Documents must be checked separately
            in this demo.
          </Text>
          <Button
            label="Verify Worker"
            loading={busy}
            onPress={() => update("verified")}
            fullWidth
          />
          <View style={{ height: 12 }} />
          <Button
            label="Reject Verification"
            variant="danger"
            disabled={busy}
            onPress={() => update("rejected")}
            fullWidth
          />
        </>
      ) : (
        <Text style={s.muted}>Loading worker details…</Text>
      )}
      <Text accessibilityLiveRegion="polite" style={s.muted}>
        {message}
      </Text>
    </MobileScreen>
  );
}
