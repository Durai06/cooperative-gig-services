// ============================================================
// CoopConnect – Design Tokens & App Constants
// ============================================================

import { TextStyle } from "react-native";

// ─── Colour Palette ──────────────────────────────────────────

export const Colors = {
  // Primary
  primaryDark: "#073B76",
  primary: "#066BFF",
  primaryLight: "#E7F0FF",

  // Secondary
  secondary: "#18AD60",
  secondaryLight: "#DCFCE7",

  // Background & Surfaces
  background: "#FFFFFF",
  cardBackground: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F5F9",

  // Text
  textPrimary: "#08275B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  textDisabled: "#94A3B8",
  textInverse: "#FFFFFF",

  // Border
  border: "#E5ECF5",
  borderFocus: "#066BFF",

  // Status
  success: "#15803D",
  successLight: "#DCFCE7",
  successDark: "#14532D",

  warning: "#D97706",
  warningLight: "#FEF3C7",
  warningDark: "#B45309",

  error: "#DC2626",
  errorLight: "#FEE2E2",
  errorDark: "#991B1B",

  info: "#0284C7",
  infoLight: "#E0F2FE",

  // Misc
  overlay: "rgba(23, 43, 77, 0.5)",
  shadow: "rgba(23, 43, 77, 0.08)",
  divider: "#F1F5F9",
  star: "#F59E0B",
  emergency: "#EF4444",
  emergencyLight: "#FEE2E2",
} as const;

// ─── Spacing ─────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ─── Typography ──────────────────────────────────────────────

export const Typography = {
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 28,
    hero: 32,
  },
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
    extraBold: "800" as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Pre-composed typography styles
  h1: {
    fontSize: 28,
    fontWeight: "800",
    color: "#08275B",
    lineHeight: 34,
  } as TextStyle,
  h2: {
    fontSize: 24,
    fontWeight: "700",
    color: "#08275B",
    lineHeight: 30,
  } as TextStyle,
  h3: {
    fontSize: 20,
    fontWeight: "700",
    color: "#08275B",
    lineHeight: 26,
  } as TextStyle,
  h4: {
    fontSize: 18,
    fontWeight: "700",
    color: "#08275B",
    lineHeight: 24,
  } as TextStyle,
  subtitle1: {
    fontSize: 16,
    fontWeight: "600",
    color: "#08275B",
    lineHeight: 22,
  } as TextStyle,
  subtitle2: {
    fontSize: 14,
    fontWeight: "600",
    color: "#08275B",
    lineHeight: 20,
  } as TextStyle,
  body1: {
    fontSize: 15,
    fontWeight: "400",
    color: "#08275B",
    lineHeight: 22,
  } as TextStyle,
  body2: {
    fontSize: 13,
    fontWeight: "400",
    color: "#64748B",
    lineHeight: 18,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: "400",
    color: "#64748B",
    lineHeight: 16,
  } as TextStyle,
  button: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  } as TextStyle,
  buttonSm: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  } as TextStyle,
} as const;

// ─── Border Radius ───────────────────────────────────────────

export const Radius = {
  xs: 4,
  sm: 6,
  md: 8,
  base: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
  round: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: "#08275B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#08275B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#08275B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ─── Service Categories ──────────────────────────────────────

export const SERVICE_CATEGORIES = [
  {
    id: "electrician",
    name: "Electrician",
    icon: "zap",
    description: "Wiring, repairs & installations",
  },
  {
    id: "plumber",
    name: "Plumber",
    icon: "droplets",
    description: "Pipes, drains & fixtures",
  },
  {
    id: "carpenter",
    name: "Carpenter",
    icon: "hammer",
    description: "Furniture & woodwork",
  },
  {
    id: "painter",
    name: "Painter",
    icon: "paintbrush",
    description: "Interior & exterior painting",
  },
  {
    id: "cleaner",
    name: "Cleaner",
    icon: "sparkles",
    description: "Home & office cleaning",
  },
  {
    id: "gardener",
    name: "Gardener",
    icon: "leaf",
    description: "Landscaping & maintenance",
  },
  {
    id: "domestic_helper",
    name: "Domestic Helper",
    icon: "home",
    description: "Household assistance",
  },
  {
    id: "caregiver",
    name: "Caregiver",
    icon: "heart",
    description: "Elder & child care",
  },
  {
    id: "driver",
    name: "Driver",
    icon: "car",
    description: "Driving & transport",
  },
  {
    id: "technician",
    name: "Technician",
    icon: "wrench",
    description: "Appliance & device repair",
  },
] as const;

export type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]["id"];

// ─── Booking Status Labels ───────────────────────────────────

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  worker_assigned: "Worker Assigned",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  worker_assigned: Colors.info,
  accepted: Colors.primary,
  in_progress: Colors.secondary,
  completed: Colors.success,
  cancelled: Colors.error,
};

// ─── Verification Status ─────────────────────────────────────

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Verification",
  verified: "Verified",
  rejected: "Rejected",
};

export const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  verified: Colors.success,
  rejected: Colors.error,
};

// ─── Complaint Categories ────────────────────────────────────

export const COMPLAINT_CATEGORIES = [
  { id: "worker_no_show", label: "Worker Did Not Arrive" },
  { id: "poor_service", label: "Poor Service Quality" },
  { id: "overcharging", label: "Overcharging" },
  { id: "behaviour_issue", label: "Behaviour Issue" },
  { id: "other", label: "Other" },
] as const;

// ─── Complaint Status ────────────────────────────────────────

export const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
};

export const COMPLAINT_STATUS_COLORS: Record<string, string> = {
  open: Colors.error,
  under_review: Colors.warning,
  resolved: Colors.success,
};

// ─── Matching Weights ────────────────────────────────────────

export const MATCHING_WEIGHTS = {
  skill: 40,
  availability: 20,
  rating: 15,
  experience: 10,
  proximity: 10,
  workload: 5,
} as const;

// ─── API Config ──────────────────────────────────────────────

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

export const USE_MOCK_DATA = !process.env.EXPO_PUBLIC_API_URL;
