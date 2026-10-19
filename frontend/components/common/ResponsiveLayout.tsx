import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  type TextProps,
  useWindowDimensions,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import {
  SafeAreaView,
  type SafeAreaViewProps,
} from "react-native-safe-area-context";
import { useSegments } from "expo-router";

export const BREAKPOINTS = { tablet: 768, desktop: 1024, wide: 1440 } as const;
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const segments = useSegments();
  const inRole = ["(customer)", "(worker)", "(admin)"].includes(
    segments[0] as string,
  );
  const sidebarWidth = width >= 1024 ? 232 : width >= 768 ? 100 : 0;
  const availableWidth = width - (inRole ? sidebarWidth : 0);
  return {
    width,
    height,
    availableWidth,
    sidebarWidth,
    isTablet: width >= 768,
    isDesktop: width >= 1024,
    gutter: availableWidth < 375 ? 16 : availableWidth >= 1024 ? 32 : 24,
  };
}

/** A shared frame for existing screens. Scroll ownership stays with each screen. */
export function PageFrame({
  children,
  style,
  form = false,
  maxWidth,
  ...props
}: SafeAreaViewProps & { form?: boolean; maxWidth?: number }) {
  const { isDesktop } = useResponsiveLayout();
  return (
    <SafeAreaView {...props} style={[styles.frame, style]}>
      <View
        style={[
          styles.page,
          {
            maxWidth: maxWidth ?? (form ? 560 : 1200),
            paddingHorizontal: isDesktop ? 16 : 0,
            backgroundColor:
              StyleSheet.flatten(style)?.backgroundColor ?? "#fff",
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

export function ResponsiveGrid({
  children,
  minItemWidth = 300,
  maxColumns = 2,
  gap = 16,
  style,
}: {
  children: React.ReactNode;
  minItemWidth?: number;
  maxColumns?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { availableWidth, gutter } = useResponsiveLayout();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const width =
    measuredWidth || Math.max(0, Math.min(availableWidth, 1200) - gutter * 2);
  const columns = Math.max(
    1,
    Math.min(maxColumns, Math.floor((width + gap) / (minItemWidth + gap))),
  );
  const itemWidth = Math.max(0, (width - (columns - 1) * gap) / columns);
  return (
    <View
      onLayout={(event) => setMeasuredWidth(event.nativeEvent.layout.width)}
      style={[styles.grid, { gap }, style]}
    >
      {React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child, index) => (
          <View
            key={React.isValidElement(child) ? (child.key ?? index) : index}
            style={{ width: itemWidth, minWidth: 0 }}
          >
            {child}
          </View>
        ))}
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { flex: 1, minWidth: 0, backgroundColor: "#F4F7FB" },
  page: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    minWidth: 0,
    backgroundColor: "#fff",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    width: "100%",
  },
});

export function PageHeading({ style, ...props }: TextProps) {
  const { isDesktop, isTablet } = useResponsiveLayout();
  return (
    <Text
      {...props}
      accessibilityRole="header"
      style={[
        {
          color: "#08275B",
          fontSize: isDesktop ? 28 : isTablet ? 24 : 21,
          lineHeight: isDesktop ? 36 : 29,
          fontWeight: "800",
          marginBottom: 8,
        },
        style,
      ]}
    />
  );
}
