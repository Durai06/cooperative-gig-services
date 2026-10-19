import { Brand } from "@/components/common/Brand";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { Radius, Typography } from "@/constants";
import { router } from "expo-router";
import {
  HardHat,
  Landmark,
  LogIn,
  UserPlus,
  UserRound,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const roles = [
  {
    id: "customer",
    title: "Customer",
    desc: "Book trusted services for your home",
    color: "#0874FF",
    Icon: UserRound,
    hasRegister: true,
    registerPath: "/(auth)/register-customer",
  },
  {
    id: "worker",
    title: "Worker",
    desc: "Find jobs and grow your career with a cooperative",
    color: "#1CB968",
    Icon: HardHat,
    hasRegister: true,
    registerPath: "/(auth)/register-worker",
  },
  {
    id: "admin",
    title: "Cooperative Admin",
    desc: "Manage workers and society operations",
    color: "#8061F5",
    Icon: Landmark,
    hasRegister: false,
    registerPath: "",
  },
];

export default function Roles() {
  return (
    <MobileScreen back>
      <View style={{ alignItems: "center", marginVertical: 20 }}>
        <Brand />
        <Text style={[s.heading, { marginTop: 24 }]}>Join CoopConnect</Text>
        <Text style={s.muted}>Choose whether to Log In or Register</Text>
      </View>

      {roles.map(({ id, title, desc, color, Icon, hasRegister, registerPath }) => (
        <View
          key={id}
          style={[
            s.card,
            {
              padding: 18,
              backgroundColor: "#FFFFFF",
              borderWidth: 1.5,
              borderColor: "#E7EEF7",
              marginBottom: 16,
              borderRadius: Radius.lg,
            },
          ]}
        >
          <View style={[s.row, { marginBottom: 14 }]}>
            <View
              style={{
                backgroundColor: color,
                padding: 12,
                borderRadius: Radius.full,
              }}
            >
              <Icon size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{title}</Text>
              <Text style={[s.muted, { marginTop: 3 }]}>{desc}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.loginBtn, { backgroundColor: color }]}
              onPress={() => router.push(`/(auth)/login?role=${id}`)}
            >
              <LogIn size={15} color="#fff" />
              <Text style={styles.btnTextWhite}>Log In</Text>
            </TouchableOpacity>

            {hasRegister && (
              <TouchableOpacity
                style={[styles.btn, styles.registerBtn, { borderColor: color }]}
                onPress={() => router.push(registerPath as any)}
              >
                <UserPlus size={15} color={color} />
                <Text style={[styles.btnText, { color }]}>Register</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <Text style={[s.muted, { textAlign: "center", marginTop: 20 }]}>
        Built on trust. Powered by your cooperative society.
      </Text>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  loginBtn: {
    flex: 1.2,
  },
  registerBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
  },
  btnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  btnTextWhite: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: "#FFFFFF",
  },
});
