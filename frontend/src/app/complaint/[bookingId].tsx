import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera, ChevronDown, CheckCircle2 } from "lucide-react-native";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { bookingService } from "@/services/api/bookingService";
import { complaintService } from "@/services/api/otherServices";
import { useAuth } from "@/contexts/AuthContext";
import type { Booking, ComplaintCategory } from "@/types";
import { Colors } from "@/constants";
const categories: [ComplaintCategory, string][] = [
  ["worker_no_show", "Worker did not arrive"],
  ["poor_service", "Poor service quality"],
  ["overcharging", "Overcharging"],
  ["behaviour_issue", "Unprofessional behaviour"],
  ["other", "Other issue"],
];
export default function ComplaintForm() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking>();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ComplaintCategory>();
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    bookingService
      .getBookingById(bookingId)
      .then(setBooking)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookingId]);
  async function pick() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.35,
        base64: true,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets[0]?.base64)
        setPhotos((p) =>
          [...p, `data:image/jpeg;base64,${result.assets[0].base64}`].slice(
            0,
            3,
          ),
        );
    } catch {
      setError(
        "Could not open photos. Please retry or submit without an image.",
      );
    }
  }
  async function submit() {
    if (!user || !booking) return;
    if (!category) {
      setError("Select a complaint category.");
      return;
    }
    if (description.trim().length < 20) {
      setError("Describe the issue in at least 20 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await complaintService.submitComplaint(user.id, {
        bookingId,
        category,
        description: description.trim(),
        photos,
      });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <MobileScreen title="Submit a Complaint" back>
      {loading ? (
        <Text style={s.muted}>Loading booking…</Text>
      ) : done ? (
        <View style={{ alignItems: "center", gap: 20, paddingTop: 40 }}>
          <CheckCircle2 color={Colors.secondary} size={70} />
          <Text style={s.heading}>Complaint Submitted</Text>
          <Text style={[s.muted, { textAlign: "center" }]}>
            Your cooperative can now review your issue. Follow its progress in
            My Complaints.
          </Text>
          <Button
            label="View My Complaints"
            fullWidth
            onPress={() => router.replace("/complaint/list")}
          />
        </View>
      ) : booking ? (
        <>
          <View style={s.card}>
            <Text style={s.muted}>Booking ID</Text>
            <Text style={s.label}>#{booking.id}</Text>
            <Text style={s.muted}>{booking.service?.name}</Text>
          </View>
          <Text style={[s.label, { fontSize: 13, marginBottom: 8 }]}>
            Complaint Category
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Complaint category"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
            style={[s.card, s.between, { minHeight: 48, padding: 12 }]}
          >
            <Text style={s.muted}>
              {categories.find(([key]) => key === category)?.[1] ??
                "Select category"}
            </Text>
            <ChevronDown size={18} color={Colors.textSecondary} />
          </Pressable>
          {expanded && (
            <View style={s.card}>
              {categories.map(([key, label]) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  onPress={() => {
                    setCategory(key);
                    setExpanded(false);
                  }}
                  style={{ paddingVertical: 12 }}
                >
                  <Text style={s.muted}>{label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Input
            label="Description"
            placeholder="Describe your issue…"
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ minHeight: 130, textAlignVertical: "top" }}
          />
          <Text
            style={[s.label, { fontSize: 13, marginTop: 10, marginBottom: 10 }]}
          >
            Add Photos (Optional)
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            {photos.map((uri, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${i + 1}`}
                onPress={() =>
                  setPhotos((p) => p.filter((_, index) => index !== i))
                }
              >
                <Image
                  source={{ uri }}
                  style={{ width: 85, height: 85, borderRadius: 10 }}
                />
                <Text style={[s.muted, { fontSize: 10 }]}>Tap to remove</Text>
              </Pressable>
            ))}
          </View>
          {photos.length < 3 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add Image"
              onPress={pick}
              style={[
                s.card,
                {
                  alignItems: "center",
                  padding: 24,
                  backgroundColor: "#F1F5FA",
                },
              ]}
            >
              <Camera size={24} color={Colors.primaryDark} />
              <Text style={s.muted}>Add Image</Text>
            </Pressable>
          )}
          <Text
            accessibilityRole="alert"
            style={{ color: Colors.error, marginBottom: 14 }}
          >
            {error}
          </Text>
          <Button
            label="Submit Complaint"
            variant="danger"
            loading={busy}
            onPress={submit}
            fullWidth
          />
        </>
      ) : (
        <Text style={s.muted}>{error || "Booking not found."}</Text>
      )}
    </MobileScreen>
  );
}
