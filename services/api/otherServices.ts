import { hydrateDemo, persistDemo } from "@/services/demoStore";
import { notify } from "@/services/events";
import { requireRole } from "@/services/session";
// ============================================================
// CoopConnect – Rating, Complaint, Notification & Analytics Services
// ============================================================

import {
  MOCK_BOOKINGS,
  MOCK_COMPLAINTS,
  MOCK_NOTIFICATIONS,
  MOCK_RATINGS,
  MOCK_SERVICES,
  MOCK_USERS,
  MOCK_WORKERS,
} from "@/services/mockData";
import type {
  AnalyticsSummary,
  AppNotification,
  Complaint,
  ComplaintStatus,
  Rating,
  SubmitComplaintPayload,
  SubmitRatingPayload,
} from "@/types";

function delay(ms = 500): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Rating Service ──────────────────────────────────────────

export const ratingService = {
  async submitRating(payload: SubmitRatingPayload): Promise<Rating> {
    await hydrateDemo();
    await delay(600);
    const actor = requireRole("customer");
    const booking = MOCK_BOOKINGS.find((b) => b.id === payload.bookingId);
    if (
      !booking ||
      booking.customerId !== actor.id ||
      booking.workerId !== payload.workerId ||
      booking.status !== "completed"
    )
      throw new Error("Only your completed bookings can be reviewed.");
    for (const score of [
      payload.overall,
      payload.workQuality,
      payload.punctuality,
      payload.behaviour,
      payload.professionalism,
    ])
      if (!Number.isInteger(score) || score < 1 || score > 5)
        throw new Error("Ratings must be between 1 and 5.");
    if (payload.review.trim().length < 5)
      throw new Error("Please add a short review.");
    const already = MOCK_RATINGS.find((r) => r.bookingId === payload.bookingId);
    if (already)
      throw new Error("You have already submitted a review for this booking.");
    const newRating: Rating = {
      id: `rat-${Date.now()}`,
      bookingId: payload.bookingId,
      customerId: actor.id,
      workerId: payload.workerId,
      overall: payload.overall,
      workQuality: payload.workQuality,
      punctuality: payload.punctuality,
      behaviour: payload.behaviour,
      professionalism: payload.professionalism,
      review: payload.review,
      createdAt: new Date().toISOString(),
    };
    MOCK_RATINGS.push(newRating);
    const worker = MOCK_WORKERS.find((w) => w.id === payload.workerId);
    if (worker) {
      worker.rating =
        Math.round(
          ((worker.rating * worker.totalRatings + payload.overall) /
            (worker.totalRatings + 1)) *
            10,
        ) / 10;
      worker.totalRatings += 1;
    }
    await persistDemo();
    return newRating;
  },

  async getRatingForBooking(bookingId: string): Promise<Rating | undefined> {
    await hydrateDemo();
    await delay(300);
    return MOCK_RATINGS.find((r) => r.bookingId === bookingId);
  },

  async getWorkerRatings(workerId: string): Promise<Rating[]> {
    await hydrateDemo();
    await delay();
    return MOCK_RATINGS.filter((r) => r.workerId === workerId);
  },
};

// ─── Complaint Service ───────────────────────────────────────

export const complaintService = {
  async submitComplaint(
    customerId: string,
    payload: SubmitComplaintPayload,
  ): Promise<Complaint> {
    await hydrateDemo();
    await delay(600);
    const booking = MOCK_BOOKINGS.find((b) => b.id === payload.bookingId);
    const actor = requireRole("customer");
    if (!booking || booking.customerId !== actor.id || actor.id !== customerId)
      throw new Error("Choose one of your own bookings.");
    if (payload.description.trim().length < 20)
      throw new Error("Please describe the issue in at least 20 characters.");
    const customer = MOCK_USERS.find((u) => u.id === customerId);
    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}`,
      bookingId: payload.bookingId,
      booking,
      customerId,
      customer,
      category: payload.category,
      photos: payload.photos?.slice(0, 3),
      description: payload.description,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_COMPLAINTS.push(newComplaint);
    notify(
      customerId,
      "complaint_update",
      "Complaint received",
      "Your cooperative can now review your complaint.",
      payload.bookingId,
    );
    await persistDemo();
    return newComplaint;
  },

  async getCustomerComplaints(customerId: string): Promise<Complaint[]> {
    await hydrateDemo();
    await delay();
    const actor = requireRole("customer");
    if (actor.id !== customerId) throw new Error("Invalid customer.");
    return MOCK_COMPLAINTS.filter((c) => c.customerId === customerId);
  },

  async getAllComplaints(): Promise<Complaint[]> {
    await hydrateDemo();
    await delay();
    requireRole("admin");
    return [...MOCK_COMPLAINTS].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async updateComplaintStatus(
    complaintId: string,
    status: ComplaintStatus,
    resolutionNote?: string,
  ): Promise<Complaint> {
    await hydrateDemo();
    await delay(500);
    requireRole("admin");
    const idx = MOCK_COMPLAINTS.findIndex((c) => c.id === complaintId);
    if (idx === -1) throw new Error("Complaint not found.");
    const current = MOCK_COMPLAINTS[idx].status;
    if (
      current === "resolved" ||
      (current === "under_review" && status === "open")
    )
      throw new Error("Complaint cannot move backwards.");
    if (status === "resolved" && !resolutionNote?.trim())
      throw new Error("Add a resolution note.");
    MOCK_COMPLAINTS[idx] = {
      ...MOCK_COMPLAINTS[idx],
      status,
      resolutionNote: resolutionNote ?? MOCK_COMPLAINTS[idx].resolutionNote,
      updatedAt: new Date().toISOString(),
    };
    notify(
      MOCK_COMPLAINTS[idx].customerId,
      "complaint_update",
      "Complaint updated",
      `Your complaint is ${status.replace("_", " ")}.`,
      MOCK_COMPLAINTS[idx].bookingId,
    );
    await persistDemo();
    return MOCK_COMPLAINTS[idx];
  },
};

// ─── Notification Service ────────────────────────────────────

export const notificationService = {
  async getUserNotifications(userId: string): Promise<AppNotification[]> {
    await hydrateDemo();
    await delay(300);
    const actor = requireRole("customer", "worker", "admin");
    if (actor.id !== userId) throw new Error("Invalid user.");
    return MOCK_NOTIFICATIONS.filter((n) => n.userId === userId).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async markAsRead(notificationId: string): Promise<void> {
    await hydrateDemo();
    await delay(200);
    const n = MOCK_NOTIFICATIONS.find((n) => n.id === notificationId);
    const actor = requireRole("customer", "worker", "admin");
    if (n && n.userId !== actor.id) throw new Error("Invalid notification.");
    if (n) n.read = true;
    await persistDemo();
  },

  async markAllAsRead(userId: string): Promise<void> {
    await hydrateDemo();
    await delay(300);
    const actor = requireRole("customer", "worker", "admin");
    if (actor.id !== userId) throw new Error("Invalid user.");
    MOCK_NOTIFICATIONS.filter((n) => n.userId === userId).forEach((n) => {
      n.read = true;
    });
    await persistDemo();
  },
};

// ─── Analytics Service ───────────────────────────────────────

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    await hydrateDemo();
    await delay(400);
    const statuses = [
      "pending",
      "worker_assigned",
      "accepted",
      "in_progress",
      "completed",
      "cancelled",
    ] as const;
    const ratingCount = MOCK_WORKERS.reduce(
      (sum, w) => sum + w.totalRatings,
      0,
    );
    return {
      totalWorkers: MOCK_WORKERS.length,
      verifiedWorkers: MOCK_WORKERS.filter(
        (w) => w.verificationStatus === "verified",
      ).length,
      pendingVerifications: MOCK_WORKERS.filter(
        (w) => w.verificationStatus === "pending",
      ).length,
      availableWorkers: MOCK_WORKERS.filter(
        (w) => w.availability && w.verificationStatus === "verified",
      ).length,
      activeBookings: MOCK_BOOKINGS.filter(
        (b) => !["cancelled", "completed"].includes(b.status),
      ).length,
      completedBookings: MOCK_BOOKINGS.filter((b) => b.status === "completed")
        .length,
      pendingComplaints: MOCK_COMPLAINTS.filter((c) => c.status !== "resolved")
        .length,
      serviceDemand: MOCK_SERVICES.map((service) => ({
        serviceId: service.id,
        serviceName: service.name,
        bookingCount: MOCK_BOOKINGS.filter((b) => b.serviceId === service.id)
          .length,
      })),
      bookingsByStatus: statuses.map((status) => ({
        status,
        count: MOCK_BOOKINGS.filter((b) => b.status === status).length,
      })),
      averageRating: ratingCount
        ? MOCK_WORKERS.reduce((sum, w) => sum + w.rating * w.totalRatings, 0) /
          ratingCount
        : 0,
    };
  },
};
