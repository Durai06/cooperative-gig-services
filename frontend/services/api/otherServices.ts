// ============================================================
// CoopConnect – Rating, Complaint, Notification & Analytics Services
// Strict FastAPI communication; requires running backend server.
// ============================================================

import { apiClient } from "@/services/api/client";
import type {
  AnalyticsSummary,
  AppNotification,
  Complaint,
  ComplaintStatus,
  Cooperative,
  Rating,
  Service,
  SubmitComplaintPayload,
  SubmitRatingPayload,
} from "@/types";

// ─── Rating Service ──────────────────────────────────────────

export const ratingService = {
  async submitRating(payload: SubmitRatingPayload): Promise<Rating> {
    const res = await apiClient.post<Rating>("/ratings", payload);
    return res.data;
  },

  async getRatingForBooking(bookingId: string): Promise<Rating | undefined> {
    const res = await apiClient.get<Rating[]>("/ratings", {
      params: { booking_id: bookingId },
    });
    return res.data?.[0];
  },

  async getWorkerRatings(workerId: string): Promise<Rating[]> {
    const res = await apiClient.get<Rating[]>("/ratings", {
      params: { worker_id: workerId },
    });
    return res.data;
  },
};

// ─── Complaint Service ───────────────────────────────────────

export const complaintService = {
  async submitComplaint(
    customerId: string,
    payload: SubmitComplaintPayload,
  ): Promise<Complaint> {
    const res = await apiClient.post<Complaint>("/complaints", payload);
    return res.data;
  },

  async getCustomerComplaints(customerId: string): Promise<Complaint[]> {
    const res = await apiClient.get<Complaint[]>("/complaints");
    return res.data;
  },

  async getAllComplaints(): Promise<Complaint[]> {
    const res = await apiClient.get<Complaint[]>("/complaints");
    return res.data;
  },

  async updateComplaintStatus(
    complaintId: string,
    status: ComplaintStatus,
    resolutionNote?: string,
  ): Promise<Complaint> {
    const res = await apiClient.patch<Complaint>(
      `/complaints/${complaintId}/resolve`,
      {
        status,
        resolutionNote,
      },
    );
    return res.data;
  },
};

// ─── Notification Service ────────────────────────────────────

export const notificationService = {
  async getUserNotifications(userId: string): Promise<AppNotification[]> {
    const res = await apiClient.get<AppNotification[]>("/notifications");
    return res.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(userId: string): Promise<void> {
    await apiClient.patch("/notifications/read-all");
  },
};

// ─── Analytics Service ───────────────────────────────────────

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    const res = await apiClient.get<AnalyticsSummary>("/admin/analytics");
    return res.data;
  },
};

// ─── Catalogue Service ───────────────────────────────────────

export const catalogueService = {
  async getServices(): Promise<Service[]> {
    const res = await apiClient.get<any[]>("/services");
    return res.data.map((s) => ({
      ...s,
      basePrice: s.basePrice ?? s.base_price ?? 0,
    }));
  },

  async getServiceById(serviceId: string): Promise<Service> {
    const res = await apiClient.get<any>(`/services/${serviceId}`);
    return {
      ...res.data,
      basePrice: res.data?.basePrice ?? res.data?.base_price ?? 0,
    };
  },

  async getCooperatives(): Promise<Cooperative[]> {
    const res = await apiClient.get<Cooperative[]>("/cooperatives");
    return res.data;
  },
};

// Backward-compatibility aliases
export const mockRatingService = ratingService;
export const mockComplaintService = complaintService;
export const mockNotificationService = notificationService;
export const mockAnalyticsService = analyticsService;
