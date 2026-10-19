import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { Badge } from "@/components/common/UIKit";
import { useAuth } from "@/contexts/AuthContext";
import { complaintService } from "@/services/api/otherServices";
import type { Complaint } from "@/types";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
export default function Complaints() {
  const { user } = useAuth();
  const [items, setItems] = useState<Complaint[]>([]);
  const [message, setMessage] = useState("Loading complaints…");
  useFocusEffect(
    useCallback(() => {
      if (user)
        complaintService
          .getCustomerComplaints(user.id)
          .then((data) => {
            setItems(data);
            setMessage(
              data.length
                ? ""
                : "You have no complaints. You can report an issue from your booking details.",
            );
          })
          .catch((e) => setMessage(e.message));
    }, [user]),
  );
  return (
    <MobileScreen title="My Complaints" back>
      <Text style={s.muted}>{message}</Text>
      {items.map((c) => (
        <Pressable
          accessibilityRole="button"
          key={c.id}
          style={s.card}
          onPress={() => router.push(`/booking/${c.bookingId}`)}
        >
          <View style={s.between}>
            <Text style={s.label}>#{c.bookingId}</Text>
            <Badge
              label={c.status.replace("_", " ")}
              variant={c.status === "resolved" ? "success" : "warning"}
            />
          </View>
          <Text style={s.muted}>{c.category.replaceAll("_", " ")}</Text>
          <Text style={s.muted}>{c.description}</Text>
          {c.resolutionNote && (
            <Text style={s.label}>Resolution: {c.resolutionNote}</Text>
          )}
        </Pressable>
      ))}
    </MobileScreen>
  );
}
