import { WorkerPortrait } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";
import {
  MobileScreen,
  mobileStyles as s,
} from "@/components/common/MobileScreen";
import { ServiceIcon } from "@/components/common/ServiceIcon";
import { Colors } from "@/constants";
import { catalogueService } from "@/services/api/otherServices";
import type { Service } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { BadgeCheck, Clock, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function ServiceDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogueService
      .getServiceById(id)
      .then(setService)
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <MobileScreen title="Service" back>
        <ActivityIndicator color={Colors.primary} />
      </MobileScreen>
    );

  if (!service)
    return (
      <MobileScreen title="Service" back>
        <Text style={s.muted}>This service is unavailable.</Text>
      </MobileScreen>
    );

  return (
    <MobileScreen title={service.name} back>
      <View
        style={{
          backgroundColor: "#ECF4FF",
          borderRadius: 18,
          alignItems: "center",
          paddingTop: 24,
          marginBottom: 24,
        }}
      >
        <WorkerPortrait size={210} variant={0} />
      </View>
      <View style={s.between}>
        <Text style={s.heading}>{service.name}</Text>
        <ServiceIcon category={service.category} />
      </View>
      <View style={[s.row, { marginVertical: 12 }]}>
        <BadgeCheck size={18} color={Colors.secondary} />
        <Text style={s.muted}>Cooperative verified professionals</Text>
      </View>
      <Text style={[s.muted, { fontSize: 15, marginVertical: 12 }]}>
        {service.description}. Get reliable help from experienced local
        professionals, with transparent pricing and support from your
        cooperative.
      </Text>
      <View style={[s.card, { marginVertical: 20 }]}>
        <View style={s.row}>
          <ShieldCheck size={19} color={Colors.secondary} />
          <Text style={s.label}>Starting from ₹{service.basePrice}</Text>
        </View>
        <Text style={s.muted}>
          Final price agreed before work begins. Materials may cost extra.
        </Text>
        <View style={s.row}>
          <Clock size={18} color={Colors.primary} />
          <Text style={s.muted}>Choose a time that works for you</Text>
        </View>
      </View>
      <Button
        label="Book Now"
        fullWidth
        onPress={() =>
          router.push(`/booking/create?service=${service.category}`)
        }
      />
    </MobileScreen>
  );
}
