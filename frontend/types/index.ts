// ============================================================
// CoopConnect – Centralized Type Definitions
// ============================================================

// ─── User & Authentication ───────────────────────────────────

export type UserRole = "customer" | "worker" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  address?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterCustomerPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  address: string;
}

export interface RegisterWorkerPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  skills: string[];
  experience: number;
  cooperativeId: string;
  serviceLocation: string;
}

// ─── Cooperative ─────────────────────────────────────────────

export interface Cooperative {
  id: string;
  name: string;
  location: string;
  contact: string;
}

// ─── Service / Category ──────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  icon: string;
  category: string;
}

// ─── Worker ──────────────────────────────────────────────────

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface WorkerSkill {
  id: string;
  workerId: string;
  serviceId: string;
  serviceName: string;
}

export interface Worker {
  id: string;
  userId: string;
  user: User;
  cooperativeId: string;
  cooperative?: Cooperative;
  experience: number; // years
  rating: number; // 0-5
  totalRatings: number;
  availability: boolean;
  location: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: VerificationStatus;
  skills: WorkerSkill[];
  activeJobs: number;
  completedJobs: number;
  earnings: number;
  schedule?: { day: string; enabled: boolean; shift: string }[];
  serviceRadiusKm?: number;
  emergencyAvailable?: boolean;
}

// ─── Booking ─────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "worker_assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  customerId: string;
  customer?: User;
  workerId?: string;
  worker?: Worker;
  serviceId: string;
  service?: Service;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  preferredDate: string; // ISO date
  preferredTime: string; // HH:mm
  emergency: boolean;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  serviceId: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  preferredDate: string;
  preferredTime: string;
  emergency: boolean;
  notes?: string;
}

// ─── Matching ────────────────────────────────────────────────

export interface MatchScoreBreakdown {
  skillScore: number;
  availabilityScore: number;
  ratingScore: number;
  experienceScore: number;
  proximityScore: number;
  workloadScore: number;
  total: number;
}

export interface WorkerMatch {
  worker: Worker;
  score: number;
  breakdown: MatchScoreBreakdown;
  distanceKm?: number;
}

// ─── Rating ──────────────────────────────────────────────────

export interface Rating {
  id: string;
  bookingId: string;
  customerId: string;
  workerId: string;
  overall: number;
  workQuality: number;
  punctuality: number;
  behaviour: number;
  professionalism: number;
  review: string;
  createdAt: string;
}

export interface SubmitRatingPayload {
  bookingId: string;
  workerId: string;
  overall: number;
  workQuality: number;
  punctuality: number;
  behaviour: number;
  professionalism: number;
  review: string;
}

// ─── Complaint ───────────────────────────────────────────────

export type ComplaintStatus = "open" | "under_review" | "resolved";
export type ComplaintCategory =
  | "worker_no_show"
  | "poor_service"
  | "overcharging"
  | "behaviour_issue"
  | "other";

export interface Complaint {
  id: string;
  bookingId: string;
  booking?: Booking;
  customerId: string;
  customer?: User;
  category: ComplaintCategory;
  description: string;
  photos?: string[];
  status: ComplaintStatus;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitComplaintPayload {
  bookingId: string;
  category: ComplaintCategory;
  description: string;
  photos?: string[];
}

// ─── Payment ─────────────────────────────────────────────────

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cash" | "card" | "upi" | "bank_transfer";

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
}

// ─── Notification ────────────────────────────────────────────

export type NotificationType =
  | "new_job_request"
  | "worker_assigned"
  | "booking_accepted"
  | "booking_cancelled"
  | "job_in_progress"
  | "service_completed"
  | "new_review"
  | "complaint_update"
  | "verification_update";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

// ─── Analytics ───────────────────────────────────────────────

export interface ServiceDemand {
  serviceId: string;
  serviceName: string;
  bookingCount: number;
}

export interface BookingStatusCount {
  status: BookingStatus;
  count: number;
}

export interface AnalyticsSummary {
  totalWorkers: number;
  verifiedWorkers: number;
  pendingVerifications: number;
  availableWorkers: number;
  activeBookings: number;
  completedBookings: number;
  pendingComplaints: number;
  serviceDemand: ServiceDemand[];
  bookingsByStatus: BookingStatusCount[];
  averageRating: number;
}

// ─── API Response ────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
