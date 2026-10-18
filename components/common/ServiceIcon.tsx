import {
  Car,
  Droplets,
  Hammer,
  HeartHandshake,
  House,
  Leaf,
  PaintRoller,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react-native";
import React from "react";
import { View } from "react-native";
const visuals = {
  electrician: [Zap, "#FFB000", "#FFF5D9"],
  plumber: [Droplets, "#0874FF", "#DFEDFF"],
  carpenter: [Hammer, "#A06528", "#F7EBD9"],
  painter: [PaintRoller, "#EC4867", "#FDE8EF"],
  cleaner: [Sparkles, "#168BF4", "#DFEFFF"],
  gardener: [Leaf, "#70AB16", "#EDF8DE"],
  caregiver: [HeartHandshake, "#A45AEF", "#F3E6FF"],
  driver: [Car, "#13A966", "#E1F5EB"],
  technician: [Wrench, "#08A2DF", "#DFF5FF"],
  domestic_helper: [House, "#1AA5A2", "#DFF6F4"],
} as const;
export function ServiceIcon({
  category,
  size = 45,
}: {
  category: string;
  size?: number;
}) {
  const [Icon, color, bg] =
    visuals[category as keyof typeof visuals] ?? visuals.technician;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={size * 0.56} color={color} strokeWidth={2.5} />
    </View>
  );
}
