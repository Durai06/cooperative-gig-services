import { fitsSchedule } from "@/features/matching/schedule";
import { assertTransition } from "@/features/bookings/transitions";
import {
  checkEligibility,
  applyFairnessAdjustment,
  matchWorkers,
} from "@/features/matching/matchingService";
import { hydrateDemo, persistDemo } from "@/services/demoStore";
import { notify } from "@/services/events";
import { requireRole } from "@/services/session";
// ============================================================
// CoopConnect – Mock Booking & Worker Services
// ============================================================

import {
  MOCK_BOOKINGS,
  MOCK_SERVICES,
  MOCK_USERS,
  MOCK_WORKERS,
} from "@/services/mockData";
import type {
  Booking,
  BookingStatus,
  CreateBookingPayload,
  Worker,
  WorkerMatch,
} from "@/types";

function delay(ms = 500): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Booking Service ─────────────────────────────────────────

export const bookingService = {
  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    await hydrateDemo();
    await delay();
    const actor = requireRole("customer");
    if (actor.id !== customerId) throw new Error("Invalid customer.");
    return MOCK_BOOKINGS.filter((b) => b.customerId === customerId).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getAllBookings(): Promise<Booking[]> {
    await hydrateDemo();
    await delay();
    requireRole("admin");
    return [...MOCK_BOOKINGS].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getWorkerBookings(workerId: string): Promise<Booking[]> {
    await hydrateDemo();
    await delay();
    const actor = requireRole("worker");
    if (!MOCK_WORKERS.some((w) => w.id === workerId && w.userId === actor.id))
      throw new Error("Invalid worker.");
    return MOCK_BOOKINGS.filter((b) => b.workerId === workerId).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getBookingById(bookingId: string): Promise<Booking | undefined> {
    await hydrateDemo();
    await delay(200);
    const actor = requireRole("customer", "worker", "admin");
    const booking = MOCK_BOOKINGS.find((b) => b.id === bookingId);
    if (
      booking &&
      actor.role !== "admin" &&
      booking.customerId !== actor.id &&
      !MOCK_WORKERS.some(
        (w) => w.id === booking.workerId && w.userId === actor.id,
      )
    )
      throw new Error("You do not have access to this booking.");
    return booking;
  },

  async createBooking(
    customerId: string,
    payload: CreateBookingPayload,
  ): Promise<Booking> {
    await hydrateDemo();
    await delay(800);
    const actor = requireRole("customer");
    if (actor.id !== customerId) throw new Error("Invalid customer.");
    const service = MOCK_SERVICES.find((s) => s.id === payload.serviceId);
    if (
      !service ||
      payload.description.trim().length < 10 ||
      payload.location.trim().length < 5
    )
      throw new Error("Please complete the booking details.");
    const scheduled = new Date(
      `${payload.preferredDate}T${payload.preferredTime}:00`,
    );
    if (
      !Number.isFinite(scheduled.getTime()) ||
      scheduled.getTime() < Date.now()
    )
      throw new Error("Choose a future date and time.");
    const customer = MOCK_USERS.find((u) => u.id === customerId);
    const newBooking: Booking = {
      id: `bkg-${Date.now()}`,
      customerId,
      customer,
      workerId: undefined,
      worker: undefined,
      serviceId: payload.serviceId,
      service,
      description: payload.description,
      location: payload.location,
      latitude: payload.latitude,
      longitude: payload.longitude,
      preferredDate: payload.preferredDate,
      preferredTime: payload.preferredTime,
      emergency: payload.emergency,
      status: "pending",
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_BOOKINGS.push(newBooking);
    notify(
      customerId,
      "worker_assigned",
      "Booking request saved",
      "Choose an available professional for your service.",
      newBooking.id,
    );
    await persistDemo();
    return newBooking;
  },

  async cancelBooking(bookingId: string): Promise<Booking> {
    await hydrateDemo();
    await delay();
    const idx = MOCK_BOOKINGS.findIndex((b) => b.id === bookingId);
    if (idx === -1) throw new Error("Booking not found.");
    const booking = MOCK_BOOKINGS[idx];
    const actor = requireRole("customer", "admin");
    if (actor.role === "customer" && actor.id !== booking.customerId)
      throw new Error("This booking belongs to another customer.");
    const cancellable: BookingStatus[] = [
      "pending",
      "worker_assigned",
      "accepted",
    ];
    if (!cancellable.includes(booking.status)) {
      throw new Error(
        "This booking cannot be cancelled at its current status.",
      );
    }
    const worker = MOCK_WORKERS.find((w) => w.id === booking.workerId);
    if (worker) worker.activeJobs = Math.max(0, worker.activeJobs - 1);
    MOCK_BOOKINGS[idx] = {
      ...booking,
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    };
    notify(
      booking.customerId,
      "booking_cancelled",
      "Booking Cancelled",
      "Your booking has been cancelled.",
      booking.id,
    );
    if (worker)
      notify(
        worker.userId,
        "booking_cancelled",
        "Booking Cancelled",
        "The customer cancelled this request.",
        booking.id,
      );
    await persistDemo();
    return MOCK_BOOKINGS[idx];
  },

  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
  ): Promise<Booking> {
    await hydrateDemo();
    await delay();
    const idx = MOCK_BOOKINGS.findIndex((b) => b.id === bookingId);
    if (idx === -1) throw new Error("Booking not found.");

    const booking = MOCK_BOOKINGS[idx];
    const actor = requireRole("worker", "admin");
    const worker = MOCK_WORKERS.find((w) => w.id === booking.workerId);
    if (actor.role === "worker" && worker?.userId !== actor.id)
      throw new Error("This job is assigned to another worker.");
    assertTransition(booking.status, newStatus);
    if (
      newStatus === "accepted" &&
      worker &&
      !checkEligibility(worker, booking.serviceId).eligible
    )
      throw new Error("You must be verified and available to accept work.");
    notify(
      booking.customerId,
      newStatus === "accepted"
        ? "booking_accepted"
        : newStatus === "completed"
          ? "service_completed"
          : newStatus === "cancelled"
            ? "booking_cancelled"
            : "job_in_progress",
      "Booking updated",
      `Your ${booking.service?.name ?? "service"} booking is now ${newStatus.replace("_", " ")}.`,
      booking.id,
    );
    if (newStatus === "completed" && worker) {
      worker.activeJobs = Math.max(0, worker.activeJobs - 1);
      worker.completedJobs += 1;
      worker.earnings += booking.service?.basePrice ?? 0;
    }
    if (newStatus === "cancelled" && worker)
      worker.activeJobs = Math.max(0, worker.activeJobs - 1);
    MOCK_BOOKINGS[idx] = {
      ...MOCK_BOOKINGS[idx],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    await persistDemo();
    return MOCK_BOOKINGS[idx];
  },

  async rejectJob(bookingId: string): Promise<Booking> {
    await hydrateDemo();
    const actor = requireRole("worker");
    const booking = MOCK_BOOKINGS.find((b) => b.id === bookingId);
    const worker = MOCK_WORKERS.find((w) => w.id === booking?.workerId);
    if (
      !booking ||
      worker?.userId !== actor.id ||
      booking.status !== "worker_assigned"
    )
      throw new Error("This request cannot be rejected.");
    worker.activeJobs = Math.max(0, worker.activeJobs - 1);
    notify(
      booking.customerId,
      "booking_cancelled",
      "Choose another worker",
      "Your worker could not accept. Your booking is saved for reassignment.",
      booking.id,
    );
    booking.workerId = undefined;
    booking.worker = undefined;
    booking.status = "pending";
    booking.updatedAt = new Date().toISOString();
    await persistDemo();
    return booking;
  },

  async assignWorker(bookingId: string, workerId: string): Promise<Booking> {
    await hydrateDemo();
    await delay(600);
    const bIdx = MOCK_BOOKINGS.findIndex((b) => b.id === bookingId);
    const worker = MOCK_WORKERS.find((w) => w.id === workerId);
    if (bIdx === -1) throw new Error("Booking not found.");
    if (!worker) throw new Error("Worker not found.");
    const actor = requireRole("customer", "admin");
    const booking = MOCK_BOOKINGS[bIdx];
    if (actor.role === "customer" && actor.id !== booking.customerId)
      throw new Error("This booking belongs to another customer.");
    assertTransition(booking.status, "worker_assigned");
    const eligibility = checkEligibility(worker, booking.serviceId);
    if (!eligibility.eligible) throw new Error(eligibility.reason);
    if (!fitsSchedule(worker, booking))
      throw new Error("Worker is outside their saved working schedule.");
    const distance = matchWorkers(booking, [worker])[0]?.distanceKm;
    if (distance !== undefined && distance > (worker.serviceRadiusKm ?? 30))
      throw new Error("Worker is outside their service area.");
    if (
      MOCK_BOOKINGS.some(
        (b) =>
          b.workerId === worker.id &&
          !["cancelled", "completed"].includes(b.status) &&
          b.preferredDate === booking.preferredDate &&
          b.preferredTime === booking.preferredTime,
      )
    )
      throw new Error("Worker is already booked for this time.");
    worker.activeJobs += 1;
    notify(
      worker.userId,
      "new_job_request",
      "New Job Request",
      `${booking.service?.name ?? "Service"} at ${booking.location}`,
      booking.id,
    );
    notify(
      booking.customerId,
      "worker_assigned",
      "Worker Assigned",
      `${worker.user.name} has received your request.`,
      booking.id,
    );
    MOCK_BOOKINGS[bIdx] = {
      ...MOCK_BOOKINGS[bIdx],
      workerId,
      worker,
      status: "worker_assigned",
      updatedAt: new Date().toISOString(),
    };
    await persistDemo();
    return MOCK_BOOKINGS[bIdx];
  },
};

// ─── Worker Service ──────────────────────────────────────────

export const workerService = {
  async getAllWorkers(): Promise<Worker[]> {
    await hydrateDemo();
    await delay();
    return [...MOCK_WORKERS];
  },

  async getWorkerById(workerId: string): Promise<Worker | undefined> {
    await hydrateDemo();
    await delay(200);
    return MOCK_WORKERS.find((w) => w.id === workerId);
  },

  async getWorkerByUserId(userId: string): Promise<Worker | undefined> {
    await hydrateDemo();
    await delay(200);
    return MOCK_WORKERS.find((w) => w.userId === userId);
  },

  async saveSchedule(
    workerId: string,
    preferences: Pick<
      Worker,
      "schedule" | "serviceRadiusKm" | "emergencyAvailable"
    >,
  ): Promise<Worker> {
    await hydrateDemo();
    const actor = requireRole("worker");
    const worker = MOCK_WORKERS.find(
      (w) => w.id === workerId && w.userId === actor.id,
    );
    if (!worker) throw new Error("Worker profile not found.");
    Object.assign(worker, preferences);
    await persistDemo();
    return worker;
  },
  async toggleAvailability(workerId: string): Promise<Worker> {
    await hydrateDemo();
    await delay(400);
    const idx = MOCK_WORKERS.findIndex((w) => w.id === workerId);
    if (idx === -1) throw new Error("Worker not found.");
    const actor = requireRole("worker");
    if (MOCK_WORKERS[idx].userId !== actor.id)
      throw new Error("Cannot change another worker.");
    MOCK_WORKERS[idx].availability = !MOCK_WORKERS[idx].availability;
    await persistDemo();
    return MOCK_WORKERS[idx];
  },

  async updateVerificationStatus(
    workerId: string,
    status: "verified" | "rejected",
    note?: string,
  ): Promise<Worker> {
    await hydrateDemo();
    await delay();
    const idx = MOCK_WORKERS.findIndex((w) => w.id === workerId);
    if (idx === -1) throw new Error("Worker not found.");
    requireRole("admin");
    notify(
      MOCK_WORKERS[idx].userId,
      "verification_update",
      "Verification updated",
      `Your profile has been ${status}.`,
    );
    MOCK_WORKERS[idx].verificationStatus = status;
    await persistDemo();
    return MOCK_WORKERS[idx];
  },

  async matchWorkersForBooking(
    booking: Pick<Booking, "serviceId" | "latitude" | "longitude"> &
      Partial<Pick<Booking, "preferredDate" | "preferredTime" | "emergency">>,
  ): Promise<WorkerMatch[]> {
    await hydrateDemo();
    await delay(700);
    const eligible = MOCK_WORKERS.filter((w) => {
      if (!fitsSchedule(w, booking)) return false;
      return !MOCK_BOOKINGS.some(
        (b) =>
          b.workerId === w.id &&
          !["cancelled", "completed"].includes(b.status) &&
          b.preferredDate === booking.preferredDate &&
          b.preferredTime === booking.preferredTime,
      );
    });
    const raw = matchWorkers(booking, eligible).filter(
      (m) =>
        m.distanceKm === undefined ||
        m.distanceKm <= (m.worker.serviceRadiusKm ?? 30),
    );
    return applyFairnessAdjustment(raw);
  },
};
