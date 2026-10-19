import { Brand, CommunityIllustration } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PageFrame } from "@/components/common/ResponsiveLayout";
export default function Splash() {
  const { isLoading, isAuthenticated, user } = useAuth();
  useEffect(() => {
    if (!isLoading && isAuthenticated && user)
      router.replace(
        user.role === "admin"
          ? "/(admin)"
          : user.role === "worker"
            ? "/(worker)"
            : "/(customer)",
      );
  }, [isLoading, isAuthenticated, user]);
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
        <View style={{ gap: 12, paddingBottom: 16 }}>
          <Button
            label="Welcome to CoopConnect"
            loading={isLoading}
            onPress={() => router.push("/onboarding")}
            fullWidth
          />
          <Button
            label="Sign In to Your Account"
            variant="outline"
            onPress={() => router.push("/(auth)/login")}
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
