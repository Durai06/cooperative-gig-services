import { ResponsiveGrid } from "@/components/common/ResponsiveLayout";
import { BookingCard } from "@/components/cards/BookingCard";
import {
  MobileScreen,
  mobileStyles as m,
} from "@/components/common/MobileScreen";
import { ServiceIcon } from "@/components/common/ServiceIcon";
import { Colors } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/api/bookingService";
import { MOCK_SERVICES } from "@/services/mockData";
import type { Booking } from "@/types";
import { router, useFocusEffect } from "expo-router";
import { Bell, MapPin, Search, ShieldCheck } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
export default function CustomerHome() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (user)
        bookingService
          .getCustomerBookings(user.id)
          .then((data) => {
            if (active) setBookings(data);
          })
          .catch(() =>
            setError("Could not load bookings. Open My bookings to retry."),
          )
          .finally(() => {
            if (active) setLoading(false);
          });
      return () => {
        active = false;
      };
    }, [user]),
  );
  const services = MOCK_SERVICES.filter(
    (x) =>
      x.category !== "domestic_helper" &&
      x.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <MobileScreen
      brand
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push("/(customer)/notifications")}
          style={{ padding: 10 }}
        >
          <Bell size={23} color="#fff" />
        </Pressable>
      }
    >
      <View style={[m.row, { marginBottom: 20 }]}>
        <MapPin size={17} color={Colors.primaryDark} />
        <Text style={[m.muted, { flex: 1 }]}>
          {user?.address ?? "Kochi, Kerala"}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 24,
          color: Colors.textPrimary,
          fontWeight: "800",
          letterSpacing: -0.6,
        }}
      >
        A little help, close to home.
      </Text>
      <Text style={[m.muted, { marginTop: 6, marginBottom: 18 }]}>
        Hello, {user?.name.split(" ")[0]}. What can we help with?
      </Text>
      <View style={s.search}>
        <Search size={19} color="#34577D" />
        <TextInput
          accessibilityLabel="Search services"
          placeholder="Search for services…"
          placeholderTextColor="#6B7F99"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, height: 46, color: Colors.textPrimary }}
        />
      </View>
      <View style={[m.between, { marginTop: 22, marginBottom: 14 }]}>
        <Text style={m.label}>Popular Services</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(customer)/services")}
        >
          <Text
            style={{
              color: Colors.primary,
              fontSize: 12,
              fontWeight: "600",
              padding: 8,
            }}
          >
            View All
          </Text>
        </Pressable>
      </View>
      <ResponsiveGrid minItemWidth={92} maxColumns={6} gap={12}>
        {services.map((service) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={service.name}
            key={service.id}
            style={s.tile}
            onPress={() => router.push(`/service/${service.id}`)}
          >
            <ServiceIcon category={service.category} />
            <Text style={s.service}>{service.name}</Text>
          </Pressable>
        ))}
      </ResponsiveGrid>
      {!services.length && (
        <Text style={m.muted}>No matching services. Try “Plumber”.</Text>
      )}
      <View style={s.trust}>
        <ShieldCheck size={19} color={Colors.secondary} />
        <Text style={{ color: "#267349", fontSize: 12, flex: 1 }}>
          Verified workers. Fair prices. Local care.
        </Text>
      </View>
      <Text style={m.section}>Recent Bookings</Text>
      {loading ? (
        <Text style={m.muted}>Loading recent bookings…</Text>
      ) : error ? (
        <Text style={m.muted}>{error}</Text>
      ) : bookings.length ? (
        <ResponsiveGrid minItemWidth={300} maxColumns={2}>
          {bookings.slice(0, 2).map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              compact
              onPress={() => router.push(`/booking/${b.id}`)}
            />
          ))}
        </ResponsiveGrid>
      ) : (
        <Text style={m.muted}>
          Your next trusted professional is a few taps away.
        </Text>
      )}
    </MobileScreen>
  );
}
const s = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 13,
    backgroundColor: "#F1F5FA",
    borderWidth: 1,
    borderColor: "#E7EEF7",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "100%",
    flexGrow: 1,

    alignItems: "center",
    backgroundColor: "#F3F8FE",
    borderRadius: 13,
    paddingVertical: 17,
    gap: 10,
  },
  service: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: "700",
    textAlign: "center",
  },
  trust: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 13,
    marginTop: 18,
    backgroundColor: "#ECF9F1",
    borderRadius: 10,
  },
});
