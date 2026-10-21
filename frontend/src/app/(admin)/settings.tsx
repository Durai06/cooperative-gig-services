import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
export default function Settings() {
  const { logout } = useAuth();
  const [name, setName] = useState("Kerala Labour Cooperative");
  const [phone, setPhone] = useState("+91 484 234 5678");
  const [notifications, setNotifications] = useState(true);
  const [message, setMessage] = useState("");
  useEffect(() => {
    AsyncStorage.getItem("coopconnect.settings")
      .then((raw) => {
        if (raw) {
          const data = JSON.parse(raw);
          setName(data.name);
          setPhone(data.phone);
          setNotifications(data.notifications);
        }
      })
      .catch(() => setMessage("Could not load settings."));
  }, []);
  async function save() {
    if (name.trim().length < 3 || phone.replace(/\D/g, "").length < 10) {
      setMessage("Enter a cooperative name and valid phone number.");
      return;
    }
    try {
      await AsyncStorage.setItem(
        "coopconnect.settings",
        JSON.stringify({ name, phone, notifications }),
      );
      setMessage("Settings saved on this device.");
    } catch {
      setMessage("Could not save. Please retry.");
    }
  }
  return (
    <MobileScreen title="Settings" back>
      <Text style={s.heading}>Your Cooperative</Text>
      <Input label="Cooperative name" value={name} onChangeText={setName} />
      <Input
        label="Support phone"
        value={phone}
        keyboardType="phone-pad"
        onChangeText={setPhone}
      />
      <View style={[s.between, s.card]}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Dashboard alerts</Text>
          <Text style={s.muted}>Show pending items on the overview</Text>
        </View>
        <Switch
          accessibilityLabel="Dashboard alerts"
          value={notifications}
          onValueChange={setNotifications}
        />
      </View>
      <Button label="Save Settings" onPress={save} fullWidth />
      <Text
        accessibilityLiveRegion="polite"
        style={[s.muted, { marginVertical: 16 }]}
      >
        {message}
      </Text>
      <View style={s.card}>
        <Text style={s.label}>Offline demo mode</Text>
        <Text style={s.muted}>
          Bookings and account changes are stored on this device. A production
          backend is not connected.
        </Text>
      </View>
      <Button
        label="Sign Out"
        variant="danger"
        onPress={async () => {
          await logout();
          router.replace("/");
        }}
        fullWidth
      />
    </MobileScreen>
  );
}
