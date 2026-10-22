import { Colors } from "@/constants";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

export function Brand({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[s.brand, !compact && s.stacked]}>
      <Svg
        width={compact ? 34 : 76}
        height={compact ? 36 : 80}
        viewBox="0 0 80 84"
      >
        <Path
          d="M9 40 40 12 71 40M18 34V72H62V34"
          fill="none"
          stroke={light ? "#fff" : "#073C78"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 40 40 12M24 26V10H33V18"
          stroke="#25BE6A"
          strokeWidth="6"
          fill="none"
        />
        <Circle cx="40" cy="41" r="6" fill="#25BE6A" />
        <Path d="M30 65V55Q40 43 50 55V65" fill="#25BE6A" />
        <Circle cx="25" cy="49" r="4" fill={light ? "#fff" : "#0874FF"} />
        <Path d="M18 69V59Q25 51 32 59V69" fill={light ? "#fff" : "#0874FF"} />
        <Circle cx="56" cy="49" r="4" fill={light ? "#fff" : "#0874FF"} />
        <Path d="M49 69V59Q56 51 63 59V69" fill={light ? "#fff" : "#0874FF"} />
      </Svg>
      <Text
        style={{
          fontSize: compact ? 20 : 29,
          fontWeight: "800",
          letterSpacing: -0.8,
          color: light ? "#fff" : Colors.textPrimary,
        }}
      >
        Sevai One
      </Text>
    </View>
  );
}

/** Original vector artwork: crisp on Android, iOS and tablets, with no network dependency. */
export function WorkerPortrait({
  size = 64,
  variant = 0,
}: {
  size?: number;
  variant?: number;
}) {
  const shirt = ["#0869D9", "#17A369", "#0E4B89", "#8370D9"][variant % 4];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      accessibilityLabel="Skilled cooperative worker illustration"
    >
      <Rect
        width="100"
        height="110"
        rx="17"
        fill={["#E8F2FE", "#E6F5EE", "#FFF3DC", "#EEEAFE"][variant % 4]}
      />
      <Path d="M8 110V91Q9 71 40 69H60Q91 71 92 91V110" fill={shirt} />
      <Path d="M40 62V77L50 86 60 77V62" fill="#CB8B60" />
      <Ellipse cx="50" cy="43" rx="23" ry="29" fill="#E4AC7C" />
      <Path
        d="M27 39V27Q30 9 51 10Q75 12 73 36L65 28Q43 35 34 26L31 43"
        fill="#263749"
      />
      <Circle cx="41" cy="44" r="2" fill="#21334A" />
      <Circle cx="60" cy="44" r="2" fill="#21334A" />
      <Path
        d="M43 58Q51 63 59 57"
        fill="none"
        stroke="#764E38"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path d="M26 32Q24 10 49 7Q76 9 75 32Z" fill="#FFCA3A" />
      <Rect x="20" y="29" width="60" height="7" rx="3" fill="#ECA823" />
      <Path d="M49 10V29" stroke="#FFE9A0" strokeWidth="5" />
      <Path d="M31 79 40 110M69 79 60 110" stroke="#92C6F3" strokeWidth="5" />
      <Rect x="34" y="95" width="32" height="15" rx="2" fill="#073C78" />
    </Svg>
  );
}

export function CommunityIllustration() {
  return (
    <View style={s.art}>
      <Svg width="100%" height="245" viewBox="0 0 350 245">
        <Ellipse cx="175" cy="136" rx="163" ry="105" fill="#E8F3FF" />
        <Path d="M35 148V94L98 45 158 94V183H35" fill="#BEDFFF" />
        <Path
          d="M23 98 98 39 169 98"
          fill="none"
          stroke="#8ABBE8"
          strokeWidth="7"
        />
        <Rect x="76" y="113" width="40" height="70" rx="5" fill="#fff" />
        <Rect x="140" y="46" width="100" height="172" rx="17" fill="#073C78" />
        <Rect x="146" y="56" width="88" height="152" rx="11" fill="#fff" />
        <Rect x="163" y="73" width="54" height="8" rx="4" fill="#D7E9FC" />
        {[98, 126, 154].map((y) => (
          <G key={y}>
            <Circle cx="164" cy={y} r="8" fill="#D9F6E4" />
            <Path
              d={`M160 ${y}l3 3 5-6`}
              stroke="#1CAE60"
              strokeWidth="2"
              fill="none"
            />
            <Rect
              x="181"
              y={y - 3}
              width="37"
              height="6"
              rx="3"
              fill="#D7E9FC"
            />
          </G>
        ))}
        <Circle cx="284" cy="58" r="16" fill="#D7F4E4" />
        <Path
          d="M278 58l4 4 8-10"
          stroke="#1CAE60"
          strokeWidth="3"
          fill="none"
        />
        <Ellipse cx="175" cy="231" rx="145" ry="10" fill="#D4E7F9" />
      </Svg>
      <View style={s.personLeft}>
        <WorkerPortrait size={105} />
      </View>
      <View style={s.personRight}>
        <WorkerPortrait size={118} variant={1} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", gap: 7 },
  stacked: { flexDirection: "column", gap: 0 },
  art: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    position: "relative",
    marginVertical: 16,
  },
  personLeft: { position: "absolute", bottom: 4, left: 12 },
  personRight: { position: "absolute", bottom: 4, right: 9 },
});
