import { Button } from "@/components/common/Button";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { Badge } from "@/components/common/UIKit";
import { bookingService } from "@/services/api/bookingService";
import type { Booking } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
export default function Confirmation() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking>();
  const [error, setError] = useState("");
  useEffect(() => {
    bookingService
      .getBookingById(bookingId)
      .then((data) => {
        if (data) setBooking(data);
        else setError("Booking not found.");
      })
      .catch((e) => setError(e.message));
  }, [bookingId]);
  return (
    <MobileScreen title="Booking Confirmation">
      <View style={{ alignItems: "center", marginVertical: 36 }}>
        <View
          style={{
            width: 85,
            height: 85,
            borderRadius: 45,
            backgroundColor: "#1BB363",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Check size={45} color="#fff" />
        </View>
        <Text style={s.heading}>Booking Confirmed!</Text>
        <Text style={[s.muted, { textAlign: "center" }]}>
          Your request has been sent to your worker.{"\n"}We&apos;ll keep you
          updated.
        </Text>
      </View>
      {error ? (
        <Text style={s.muted}>{error}</Text>
      ) : booking ? (
        <View style={s.card}>
          {[
            ["Booking ID", booking.id],
            ["Service", booking.service?.name],
            ["Worker", booking.worker?.user.name],
            ["Date", booking.preferredDate],
            ["Time", booking.preferredTime],
            ["Address", booking.location],
          ].map(([key, value]) => (
            <View key={key} style={s.between}>
              <Text style={s.muted}>{key}</Text>
              <Text
                style={[s.label, { fontSize: 12, flex: 1, textAlign: "right" }]}
              >
                {value}
              </Text>
            </View>
          ))}
          <Badge label="Awaiting worker acceptance" variant="warning" />
        </View>
      ) : (
        <Text style={s.muted}>Loading booking…</Text>
      )}
      <Button
        label="View Details"
        fullWidth
        onPress={() => router.replace(`/booking/${bookingId}`)}
      />
      <View style={{ height: 12 }} />
      <Button
        label="Go to Home"
        variant="ghost"
        fullWidth
        onPress={() => router.replace("/(customer)")}
      />
    </MobileScreen>
  );
}
