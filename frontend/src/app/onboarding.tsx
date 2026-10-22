import { CommunityIllustration } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { Colors } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
const slides = [
  [
    "Find Trusted Skilled Workers from Your Local Cooperative",
    "Sevai One connects households and communities with verified skilled workers from Labour Cooperative Societies.",
  ],
  [
    "Reliable Help. A Few Taps Away.",
    "Choose a service, pick a convenient time, and follow your booking from request to completion.",
  ],
  [
    "Better Work. Stronger Communities.",
    "Every booking supports local professionals and fair opportunities through your cooperative.",
  ],
];
export default function Onboarding() {
  const [page, setPage] = useState(0);
  const { completeOnboarding } = useAuth();

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace("/roles");
  };

  return (
    <MobileScreen
      right={
        <Pressable
          accessibilityRole="button"
          onPress={handleFinish}
          style={{ padding: 12 }}
        >
          <Text style={s.muted}>Skip</Text>
        </Pressable>
      }
    >
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: 31,
            lineHeight: 36,
            fontWeight: "800",
            letterSpacing: -1,
          }}
        >
          {slides[page][0]}
        </Text>
        <Text style={[s.muted, { marginTop: 18 }]}>{slides[page][1]}</Text>
        <CommunityIllustration />
      </View>
      <Button
        label={page === 2 ? "Get Started" : "Continue"}
        onPress={() => (page === 2 ? handleFinish() : setPage(page + 1))}
        fullWidth
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 7,
          paddingTop: 20,
        }}
      >
        {slides.map((_, i) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Onboarding page ${i + 1}`}
            key={i}
            onPress={() => setPage(i)}
            style={{ padding: 8 }}
          >
            <View
              style={{
                width: i === page ? 19 : 6,
                height: 6,
                borderRadius: 4,
                backgroundColor: i === page ? Colors.primary : "#D5E2F1",
              }}
            />
          </Pressable>
        ))}
      </View>
    </MobileScreen>
  );
}
