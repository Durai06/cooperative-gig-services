import { Brand, CommunityIllustration } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";
import { PageFrame } from "@/components/common/ResponsiveLayout";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Splash() {
  const { isLoading, isAuthenticated, user, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // 1. If currently signed in, go straight to active dashboard (skip intro)
    if (isAuthenticated && user) {
      router.replace(
        user.role === "admin"
          ? "/(admin)"
          : user.role === "worker"
            ? "/(worker)"
            : "/(customer)",
      );
      return;
    }

    // 2. Once registered / onboarded, no need for intro pages: go straight to sign in / register
    if (hasCompletedOnboarding) {
      router.replace("/roles");
      return;
    }
  }, [isLoading, isAuthenticated, user, hasCompletedOnboarding]);

  return (
    <PageFrame style={s.screen}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.eyebrow}>YOUR COMMUNITY. YOUR COOPERATIVE.</Text>
        <View style={s.main}>
          <Brand light />
          <Text style={s.tagline}>
            Skilled People{"\n"}Stronger Communities
          </Text>
        </View>
        <CommunityIllustration />
        <View style={{ gap: 14, paddingBottom: 16 }}>
          <Button
            label="Welcome to CoopConnect"
            loading={isLoading}
            onPress={() => router.push("/onboarding")}
            fullWidth
          />
          <Button
            label="Sign In or Register"
            variant="outline"
            onPress={() => router.push("/roles")}
            fullWidth
            style={{ borderColor: "#BDD8F4" }}
            textStyle={{ color: "#ffffff" }}
          />
          <Text style={s.footer}>
            Trusted services, right in your neighbourhood
          </Text>
        </View>
      </ScrollView>
    </PageFrame>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#073B76", padding: 24 },
  eyebrow: {
    color: "#BDD8F4",
    fontSize: 10,
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 25,
  },
  main: {
    flex: 1,
    minHeight: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  tagline: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 27,
    textAlign: "center",
    marginTop: 18,
  },
  footer: { color: "#BDD8F4", fontSize: 11, textAlign: "center" },
});
