import { useAuth } from "@/contexts/AuthContext";
import { workerService } from "@/services/api/bookingService";
import { persistDemo } from "@/services/demoStore";
import { MOCK_USERS, MOCK_WORKERS } from "@/services/mockData";
import type { Worker } from "@/types";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { WorkerPortrait } from "./common/Brand";
import { Button } from "./common/Button";
import { Input } from "./common/Input";
import { MobileScreen, mobileStyles as s } from "./common/MobileScreen";
import { RoleSwitcherCard } from "./common/RoleSwitcher";
import { Badge } from "./common/UIKit";
export function ProfileScreen() {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [worker, setWorker] = useState<Worker>();
  useFocusEffect(
    useCallback(() => {
      if (user?.role === "worker")
        workerService
          .getWorkerByUserId(user.id)
          .then(setWorker)
          .catch((e) => setMessage(e.message));
    }, [user]),
  );
  async function save() {
    if (!user) return;
    if (
      name.trim().length < 2 ||
      phone.replace(/\D/g, "").length < 10 ||
      address.trim().length < 5
    ) {
      setMessage("Enter your name, a valid phone number and full address.");
      return;
    }
    try {
      const updated = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };
      const stored = MOCK_USERS.find((u) => u.id === user.id);
      if (stored) Object.assign(stored, updated);
      const w = MOCK_WORKERS.find((w) => w.userId === user.id);
      if (w) {
        w.user = updated;
        w.location = updated.address;
      }
      await persistDemo();
      updateUser(updated);
      setEditing(false);
      setMessage("Profile updated.");
    } catch {
      setMessage("Could not save your profile. Please try again.");
    }
  }
  return (
    <MobileScreen title={user?.role === "worker" ? "My Profile" : "Profile"}>
      <View style={[s.row, s.card]}>
        <WorkerPortrait size={74} />
        <View style={{ flex: 1 }}>
          <Text style={s.heading}>{user?.name}</Text>
          <Text style={s.muted}>{user?.email}</Text>
          {worker && (
            <Badge
              label={worker.verificationStatus}
              variant={
                worker.verificationStatus === "verified" ? "success" : "warning"
              }
            />
          )}
        </View>
      </View>
      {editing ? (
        <>
          <Input label="Full name" value={name} onChangeText={setName} />
          <Input
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            multiline
          />
          <Button label="Save Profile" fullWidth onPress={save} />
          <Button
            label="Cancel Editing"
            variant="ghost"
            fullWidth
            onPress={() => {
              setEditing(false);
              setName(user?.name ?? "");
              setPhone(user?.phone ?? "");
              setAddress(user?.address ?? "");
            }}
          />
        </>
      ) : (
        <View style={s.card}>
          <Text style={s.muted}>Phone</Text>
          <Text style={s.label}>{user?.phone}</Text>
          <Text style={s.muted}>Address</Text>
          <Text style={s.label}>{user?.address}</Text>
          <Button
            label="Edit Profile"
            variant="outline"
            fullWidth
            onPress={() => setEditing(true)}
          />
        </View>
      )}
      {worker && (
        <View style={s.card}>
          {[
            ["Skills", worker.skills.map((x) => x.serviceName).join(", ")],
            ["Experience", `${worker.experience} years`],
            ["Cooperative", worker.cooperative?.name ?? "Pending membership"],
            [
              "Rating",
              `${worker.rating.toFixed(1)} (${worker.totalRatings} reviews)`,
            ],
          ].map(([key, val]) => (
            <View key={key}>
              <Text style={s.muted}>{key}</Text>
              <Text style={s.label}>{val}</Text>
            </View>
          ))}
          <Button
            label="Manage Availability"
            variant="outline"
            onPress={() => router.push("/(worker)/availability")}
            fullWidth
          />
        </View>
      )}
      <Text accessibilityLiveRegion="polite" style={s.muted}>
        {message}
      </Text>
      {user?.role === "customer" && (
        <>
          <Button
            label="Notifications"
            variant="ghost"
            onPress={() => router.push("/(customer)/notifications")}
            fullWidth
          />
          <Button
            label="My Complaints"
            variant="ghost"
            onPress={() => router.push("/complaint/list")}
            fullWidth
          />
        </>
      )}
      <View style={[s.card, { marginTop: 20 }]}>
        <Text style={s.label}>Demo Accounts</Text>
        <Text style={s.muted}>
          Switch roles to explore this offline demo. This is not production
          authentication.
        </Text>
        <RoleSwitcherCard />
      </View>
      <Button
        label="Sign Out"
        variant="danger"
        fullWidth
        onPress={async () => {
          await logout();
          router.replace("/roles");
        }}
      />
    </MobileScreen>
  );
}
