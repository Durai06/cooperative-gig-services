import { ResponsiveGrid } from "@/components/common/ResponsiveLayout";
import { WorkerPortrait } from "@/components/common/Brand";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { Colors } from "@/constants";
import { MOCK_SERVICES } from "@/services/mockData";
import { router } from "expo-router";
import { BadgeCheck, ChevronRight, Search } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
export default function Services() {
  const [search, setSearch] = useState("");
  const services = MOCK_SERVICES.filter((x) =>
    `${x.name} ${x.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <MobileScreen title="Services">
      <View
        style={[
          s.row,
          {
            backgroundColor: "#F0F4F9",
            paddingHorizontal: 12,
            borderRadius: 12,
            marginBottom: 18,
          },
        ]}
      >
        <Search size={18} color={Colors.textSecondary} />
        <TextInput
          accessibilityLabel="Search services"
          placeholder="Search services…"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, minHeight: 46, color: Colors.textPrimary }}
        />
      </View>
      <ResponsiveGrid minItemWidth={320} maxColumns={3}>
        {services.map((x, i) => (
          <Pressable
            accessibilityRole="button"
            key={x.id}
            style={[
              s.row,
              {
                padding: 16,
                borderWidth: 1,
                borderRadius: 14,
                borderBottomWidth: 1,
                borderColor: "#EEF2F7",
              },
            ]}
            onPress={() => router.push(`/service/${x.id}`)}
          >
            <WorkerPortrait size={65} variant={i} />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={s.label}>{x.name}</Text>
              <Text style={[s.muted, { fontSize: 12 }]}>{x.description}</Text>
              <View style={s.row}>
                <BadgeCheck size={13} color={Colors.secondary} />
                <Text
                  style={{ fontSize: 11, color: Colors.textSecondary, flex: 1 }}
                >
                  Verified professionals · From ₹{x.basePrice}
                </Text>
              </View>
            </View>
            <ChevronRight size={17} color={Colors.textSecondary} />
          </Pressable>
        ))}
      </ResponsiveGrid>
      {!services.length && (
        <Text style={s.muted}>No services found. Try a different search.</Text>
      )}
    </MobileScreen>
  );
}
