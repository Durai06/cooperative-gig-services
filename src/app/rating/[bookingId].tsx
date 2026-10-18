import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Star, CheckCircle2 } from "lucide-react-native";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { WorkerPortrait } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { bookingService } from "@/services/api/bookingService";
import { ratingService } from "@/services/api/otherServices";
import type { Booking, Rating } from "@/types";
import { Colors } from "@/constants";
type Criteria =
  "overall" | "workQuality" | "punctuality" | "behaviour" | "professionalism";
function Stars({
  label,
  value,
  onChange,
  large = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  large?: boolean;
}) {
  return (
    <View
      accessibilityLabel={label}
      style={{ flexDirection: "row", justifyContent: "center" }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          accessibilityRole="radio"
          accessibilityLabel={`${label}: ${n} stars`}
          accessibilityState={{ selected: value === n }}
          onPress={() => onChange(n)}
          style={{
            width: large ? 43 : 30,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Star
            size={large ? 32 : 21}
            color={n <= value ? "#FFB000" : "#CCD7E4"}
            fill={n <= value ? "#FFB000" : "#CCD7E4"}
          />
        </Pressable>
      ))}
    </View>
  );
}
export default function Review() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking>();
  const [existing, setExisting] = useState<Rating>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState("");
  const [scores, setScores] = useState({
    overall: 5,
    workQuality: 5,
    punctuality: 5,
    behaviour: 5,
    professionalism: 5,
  });
  useEffect(() => {
    Promise.all([
      bookingService.getBookingById(bookingId),
      ratingService.getRatingForBooking(bookingId),
    ])
      .then(([b, r]) => {
        setBooking(b);
        setExisting(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookingId]);
  function setScore(key: Criteria, n: number) {
    setScores((value) => ({ ...value, [key]: n }));
  }
  async function submit() {
    if (!booking?.workerId) return;
    if (review.trim().length < 5) {
      setError("Please write a short review of at least 5 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setExisting(
        await ratingService.submitRating({
          bookingId,
          workerId: booking.workerId,
          ...scores,
          review: review.trim(),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <MobileScreen title="Rate Your Experience" back>
      {loading ? (
        <Text style={s.muted}>Loading booking…</Text>
      ) : existing ? (
        <View style={{ alignItems: "center", gap: 18, paddingTop: 40 }}>
          <CheckCircle2 size={70} color={Colors.secondary} />
          <Text style={s.heading}>Thank you for your review!</Text>
          <Text style={s.muted}>{existing.review}</Text>
          <Text style={s.label}>{existing.overall} / 5 stars</Text>
          <Button
            label="Back to Booking"
            fullWidth
            onPress={() => router.replace(`/booking/${bookingId}`)}
          />
        </View>
      ) : booking?.status === "completed" && booking.workerId ? (
        <>
          <View
            style={{
              alignItems: "center",
              gap: 7,
              marginTop: 15,
              marginBottom: 18,
            }}
          >
            <WorkerPortrait size={80} />
            <Text style={s.label}>{booking.worker?.user.name}</Text>
            <Text style={s.muted}>{booking.service?.name}</Text>
            <Stars
              label="Overall rating"
              value={scores.overall}
              onChange={(n) => setScore("overall", n)}
              large
            />
          </View>
          {(
            [
              ["workQuality", "Work Quality"],
              ["punctuality", "Punctuality"],
              ["behaviour", "Behaviour"],
              ["professionalism", "Professionalism"],
            ] as [Criteria, string][]
          ).map(([key, label]) => (
            <View key={key} style={s.between}>
              <Text style={[s.muted, { flex: 1 }]}>{label}</Text>
              <Stars
                label={label}
                value={scores[key]}
                onChange={(n) => setScore(key, n)}
              />
            </View>
          ))}
          <View style={{ marginTop: 20 }}>
            <Input
              label="Write your review"
              placeholder="Share your experience…"
              value={review}
              onChangeText={setReview}
              multiline
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
          </View>
          <Text
            accessibilityRole="alert"
            style={{ color: Colors.error, marginBottom: 12 }}
          >
            {error}
          </Text>
          <Button
            label="Submit Review"
            loading={busy}
            fullWidth
            onPress={submit}
          />
        </>
      ) : (
        <Text style={s.muted}>
          {error || "Only completed bookings can be reviewed."}
        </Text>
      )}
    </MobileScreen>
  );
}
