import { useSegments, router } from "expo-router";
import { useResponsiveLayout } from "./ResponsiveLayout";
import { Colors } from "@/constants";
import { Bell, ChevronLeft } from "lucide-react-native";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand } from "./Brand";

export function MobileScreen({
  title,
  children,
  brand = false,
  back = false,
  right,
}: {
  title?: string;
  children: React.ReactNode;
  brand?: boolean;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const layout = useResponsiveLayout();
  const segments = useSegments();
  const form =
    ["(auth)", "rating", "complaint", "roles", "onboarding"].includes(
      segments[0] as string,
    ) || ["create", "settings"].includes(segments[1] as string);
  const detail =
    ["profile", "earnings", "verification", "availability"].includes(
      segments[1] as string,
    ) || segments[0] === "service";
  const maxWidth = form ? 600 : detail ? 840 : 1200;
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: brand ? Colors.primaryDark : "#fff" }}
      edges={["top", "left", "right"]}
    >
      <View
        style={[s.header, brand && { backgroundColor: Colors.primaryDark }]}
      >
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={s.touch}
          >
            <ChevronLeft size={23} color={Colors.textPrimary} />
          </Pressable>
        )}
        {brand ? (
          <Brand light compact />
        ) : (
          <Text
            style={[
              s.title,
              { fontSize: layout.isDesktop ? 22 : layout.isTablet ? 20 : 18 },
            ]}
          >
            {title}
          </Text>
        )}
        <View style={{ marginLeft: "auto" }}>
          {right ??
            (brand ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => router.push("/notifications")}
                style={{ padding: 10 }}
              >
                <Bell size={21} color="#fff" />
              </Pressable>
            ) : null)}
        </View>
      </View>
      <KeyboardAvoidingView
        style={s.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            s.content,
            { maxWidth, padding: layout.gutter, paddingBottom: 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export const mobileStyles = StyleSheet.create({
  heading: {
    fontSize: 21,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  muted: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#FAFCFF",
    marginBottom: 12,
    gap: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 },
  between: {
    flexWrap: "wrap",
    minWidth: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  section: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 22,
    marginBottom: 14,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 9,
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: "#EEF3F8",
  },
  selected: { backgroundColor: Colors.primary },
});
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    minHeight: 62,
    gap: 8,
    backgroundColor: "#fff",
  },
  touch: { width: 38, height: 44, justifyContent: "center" },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  body: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  content: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
});
