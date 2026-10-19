import { Brand } from "@/components/common/Brand";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { router } from "expo-router";
import {
  ChevronRight,
  HardHat,
  Landmark,
  UserRound,
} from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
const roles = [
  {
    id: "customer",
    title: "Customer",
    desc: "Book trusted services for your home",
    color: "#0874FF",
    Icon: UserRound,
  },
  {
    id: "worker",
    title: "Worker",
    desc: "Find jobs and grow your career",
    color: "#1CB968",
    Icon: HardHat,
  },
  {
    id: "admin",
    title: "Cooperative Admin",
    desc: "Manage workers and operations",
    color: "#8061F5",
    Icon: Landmark,
  },
];
export default function Roles() {
  return (
    <MobileScreen back>
      <View style={{ alignItems: "center", marginVertical: 30 }}>
        <Brand />
        <Text style={[s.heading, { marginTop: 35 }]}>Join as</Text>
        <Text style={s.muted}>Choose your role to continue</Text>
      </View>
      {roles.map(({ id, title, desc, color, Icon }) => (
        <Pressable
          accessibilityRole="button"
          key={id}
          onPress={() => router.push(`/(auth)/login?role=${id}`)}
          style={[
            s.card,
            s.row,
            { padding: 22, minHeight: 110, backgroundColor: "#F5F9FF" },
          ]}
        >
          <View
            style={{ backgroundColor: color, padding: 14, borderRadius: 30 }}
          >
            <Icon size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>{title}</Text>
            <Text style={[s.muted, { marginTop: 5 }]}>{desc}</Text>
          </View>
          <ChevronRight size={18} color="#6982A2" />
        </Pressable>
      ))}
      <Text style={[s.muted, { textAlign: "center", marginTop: 28 }]}>
        Built on trust. Powered by your community.
      </Text>
    </MobileScreen>
  );
}
