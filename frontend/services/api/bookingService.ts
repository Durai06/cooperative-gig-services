// ============================================================
// CoopConnect – Booking & Worker Services (Strict Backend Driven)
// Direct FastAPI communication; requires running backend server.
// ============================================================

import { apiClient } from "@/services/api/client";
import type {
  Booking,
  BookingStatus,
  CreateBookingPayload,
  Worker,
  WorkerMatch,
} from "@/types";

// ─── Booking Service ─────────────────────────────────────────

export const bookingService = {
  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    const res = await apiClient.get<Booking[]>("/bookings", {
      params: { customer_id: customerId },
    });
    return res.data;
  },

  async getAllBookings(): Promise<Booking[]> {
    const res = await apiClient.get<Booking[]>("/bookings");
    return res.data;
  },

  async getWorkerBookings(workerId: string): Promise<Booking[]> {
    const res = await apiClient.get<Booking[]>("/bookings", {
      params: { worker_id: workerId },
    });
    return res.data;
  },

  async getBookingById(bookingId: string): Promise<Booking | undefined> {
    const res = await apiClient.get<Booking>(`/bookings/${bookingId}`);
    return res.data;
  },

  async createBooking(
    customerId: string,
    payload: CreateBookingPayload,
  ): Promise<Booking> {
    const res = await apiClient.post<Booking>("/bookings", payload);
    return res.data;
  },

  async cancelBooking(bookingId: string): Promise<Booking> {
    const res = await apiClient.patch<Booking>(`/bookings/${bookingId}/cancel`);
    return res.data;
  },

  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
  ): Promise<Booking> {
    const res = await apiClient.patch<Booking>(`/bookings/${bookingId}/status`, {
      status: newStatus,
    });
    return res.data;
  },

  async rejectJob(bookingId: string): Promise<Booking> {
    const res = await apiClient.patch<Booking>(`/bookings/${bookingId}/reject`);
    return res.data;
  },

  async assignWorker(bookingId: string, workerId: string): Promise<Booking> {
    const res = await apiClient.patch<Booking>(`/bookings/${bookingId}/assign`, {
      workerId,
    });
    return res.data;
  },
};

// ─── Worker Service ──────────────────────────────────────────

export const workerService = {
  async getAllWorkers(): Promise<Worker[]> {
    const res = await apiClient.get<Worker[]>("/workers");
    return res.data;
  },

  async getWorkerById(workerId: string): Promise<Worker | undefined> {
    const res = await apiClient.get<Worker>(`/workers/${workerId}`);
    return res.data;
  },

  async getWorkerByUserId(userId: string): Promise<Worker | undefined> {
    const res = await apiClient.get<Worker>(`/workers/by-user/${userId}`);
    return res.data;
  },

  async saveSchedule(
    workerId: string,
    preferences: Pick<
      Worker,
      "schedule" | "serviceRadiusKm" | "emergencyAvailable"
    >,
  ): Promise<Worker> {
    const res = await apiClient.patch<Worker>(`/workers/${workerId}/availability`, {
      schedule: preferences.schedule,
      service_radius_km: preferences.serviceRadiusKm,
      emergency_available: preferences.emergencyAvailable,
    });
    return res.data;
  },

  async toggleAvailability(workerId: string): Promise<Worker> {
    const res = await apiClient.patch<Worker>(
      `/workers/${workerId}/toggle-availability`,
    );
    return res.data;
  },

  async updateVerificationStatus(
    workerId: string,
    status: "verified" | "rejected",
    note?: string,
  ): Promise<Worker> {
    const res = await apiClient.patch<Worker>(`/workers/${workerId}/verify`, {
      status,
    });
    return res.data;
  },

  async matchWorkersForBooking(
    booking: Pick<Booking, "serviceId" | "latitude" | "longitude"> &
      Partial<Pick<Booking, "preferredDate" | "preferredTime" | "emergency">>,
  ): Promise<WorkerMatch[]> {
    const res = await apiClient.post<WorkerMatch[]>("/matching/find-workers", {
      serviceId: booking.serviceId,
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
      latitude: booking.latitude,
      longitude: booking.longitude,
      emergency: booking.emergency,
    });
    return res.data;
  },
};

// Backward-compatibility aliases
export const mockBookingService = bookingService;
export const mockWorkerService = workerService;
