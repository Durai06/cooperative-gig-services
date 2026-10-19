/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
// Run the actual TypeScript service modules, with an isolated device-storage adapter.
const storage = new Map();
const originalLoad = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === "@react-native-async-storage/async-storage")
    return {
      __esModule: true,
      default: {
        getItem: async (key) => storage.get(key) ?? null,
        setItem: async (key, value) => storage.set(key, value),
      },
    };
  if (name.startsWith("@/")) name = path.join(__dirname, "..", name.slice(2));
  return originalLoad.call(this, name, parent, isMain);
};
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
const {
  bookingService,
  workerService,
} = require("../services/api/bookingService.ts");
const {
  ratingService,
  complaintService,
  analyticsService,
} = require("../services/api/otherServices.ts");
const { mockAuthService } = require("../services/api/authService.ts");
const { setSessionUser } = require("../services/session.ts");
const {
  MOCK_USERS,
  MOCK_WORKERS,
  MOCK_BOOKINGS,
} = require("../services/mockData.ts");
const { fitsSchedule } = require("../features/matching/schedule.ts");
const {
  matchWorkers,
  applyFairnessAdjustment,
} = require("../features/matching/matchingService.ts");
const customer = MOCK_USERS.find((u) => u.role === "customer");
const admin = MOCK_USERS.find((u) => u.role === "admin");
const worker = MOCK_WORKERS[0];
let booking;
test("offline cooperative workflows", async (t) => {
  await t.test(
    "matching excludes unavailable, unverified and unskilled workers",
    () => {
      const matches = applyFairnessAdjustment(
        matchWorkers({ serviceId: "svc-1" }, MOCK_WORKERS),
      );
      assert.ok(matches.length > 0);
      assert.ok(
        matches.every(
          (m) =>
            m.worker.availability &&
            m.worker.verificationStatus === "verified" &&
            m.worker.skills.some((s) => s.serviceId === "svc-1"),
        ),
      );
      assert.deepEqual(
        matches.map((m) => m.worker.id),
        applyFairnessAdjustment(
          matchWorkers({ serviceId: "svc-1" }, MOCK_WORKERS),
        ).map((m) => m.worker.id),
      );
    },
  );
  await t.test(
    "saved schedules enforce working hours and emergency preferences",
    () => {
      const scheduled = {
        ...worker,
        emergencyAvailable: false,
        schedule: [
          { day: "Tuesday", enabled: true, shift: "08:00 AM – 06:00 PM" },
        ],
      };
      const request = {
        serviceId: "svc-1",
        preferredDate: "2026-10-20",
        preferredTime: "10:00",
        emergency: false,
      };
      assert.equal(fitsSchedule(scheduled, request), true);
      assert.equal(
        fitsSchedule(scheduled, { ...request, preferredTime: "19:00" }),
        false,
      );
      assert.equal(
        fitsSchedule(scheduled, { ...request, emergency: true }),
        false,
      );
      assert.equal(
        fitsSchedule(
          {
            ...scheduled,
            schedule: [{ day: "Tuesday", enabled: false, shift: "Weekly Off" }],
          },
          request,
        ),
        false,
      );
    },
  );
  await t.test("customer creates and assigns a booking", async () => {
    setSessionUser(customer);
    booking = await bookingService.createBooking(customer.id, {
      serviceId: "svc-1",
      description: "Repair a broken electrical switch",
      location: "Kakkanad, Kochi, Kerala",
      preferredDate: "2099-10-20",
      preferredTime: "11:00",
      emergency: false,
    });
    const assigned = await bookingService.assignWorker(booking.id, worker.id);
    assert.equal(assigned.status, "worker_assigned");
    await assert.rejects(
      bookingService.assignWorker(booking.id, worker.id),
      /Cannot transition/,
    );
  });
  await t.test(
    "wrong role cannot accept or inspect another customer booking",
    async () => {
      await assert.rejects(
        bookingService.updateBookingStatus(booking.id, "accepted"),
        /access/,
      );
      setSessionUser({ ...customer, id: "another-customer" });
      await assert.rejects(bookingService.getBookingById(booking.id), /access/);
    },
  );
  await t.test(
    "worker rejection returns request to unassigned queue",
    async () => {
      setSessionUser(worker.user);
      const rejected = await bookingService.rejectJob(booking.id);
      assert.equal(rejected.status, "pending");
      assert.equal(rejected.workerId, undefined);
      setSessionUser(customer);
      await bookingService.assignWorker(booking.id, worker.id);
    },
  );
  await t.test(
    "worker can accept, start and complete exactly once",
    async () => {
      setSessionUser(worker.user);
      const earned = worker.earnings;
      await bookingService.updateBookingStatus(booking.id, "accepted");
      await assert.rejects(
        bookingService.updateBookingStatus(booking.id, "completed"),
        /Cannot transition/,
      );
      await bookingService.updateBookingStatus(booking.id, "in_progress");
      await bookingService.updateBookingStatus(booking.id, "completed");
      assert.equal(worker.earnings, earned + 350);
      await assert.rejects(
        bookingService.updateBookingStatus(booking.id, "completed"),
        /Cannot transition/,
      );
      setSessionUser(customer);
      await assert.rejects(
        bookingService.cancelBooking(booking.id),
        /cannot be cancelled/,
      );
    },
  );
  await t.test(
    "customer reviews completed work, duplicate review blocked",
    async () => {
      setSessionUser(customer);
      const payload = {
        bookingId: booking.id,
        workerId: worker.id,
        overall: 5,
        workQuality: 5,
        punctuality: 4,
        behaviour: 5,
        professionalism: 5,
        review: "Helpful, careful and professional work.",
      };
      const review = await ratingService.submitRating(payload);
      assert.equal(review.customerId, customer.id);
      await assert.rejects(ratingService.submitRating(payload), /already/);
    },
  );
  await t.test(
    "complaint can be investigated and resolved by admin",
    async () => {
      const complaint = await complaintService.submitComplaint(customer.id, {
        bookingId: booking.id,
        category: "poor_service",
        description: "The replacement switch needs a further inspection.",
      });
      await assert.rejects(
        complaintService.updateComplaintStatus(complaint.id, "under_review"),
        /access/,
      );
      setSessionUser(admin);
      await complaintService.updateComplaintStatus(
        complaint.id,
        "under_review",
      );
      const resolved = await complaintService.updateComplaintStatus(
        complaint.id,
        "resolved",
        "Cooperative arranged a follow-up inspection.",
      );
      assert.equal(resolved.status, "resolved");
      await assert.rejects(
        complaintService.updateComplaintStatus(complaint.id, "open"),
        /backwards/,
      );
    },
  );
  await t.test(
    "worker registration creates a pending worker record; admin can verify",
    async () => {
      const { user } = await mockAuthService.registerWorker({
        name: "Test Worker",
        email: "isolated-test@example.test",
        phone: "9876543210",
        password: "demo123",
        skills: ["electrician"],
        experience: 3,
        cooperativeId: "coop-1",
        serviceLocation: "Kochi, Kerala",
      });
      const created = await workerService.getWorkerByUserId(user.id);
      assert.ok(created);
      assert.equal(created.verificationStatus, "pending");
      assert.equal(created.skills[0].workerId, created.id);
      setSessionUser(user);
      await assert.rejects(
        workerService.updateVerificationStatus(created.id, "verified"),
        /access/,
      );
      setSessionUser(admin);
      assert.equal(
        (await workerService.updateVerificationStatus(created.id, "verified"))
          .verificationStatus,
        "verified",
      );
    },
  );
  await t.test(
    "availability, schedule and analytics follow changed records",
    async () => {
      setSessionUser(worker.user);
      const previous = worker.availability;
      assert.equal(
        (await workerService.toggleAvailability(worker.id)).availability,
        !previous,
      );
      const saved = await workerService.saveSchedule(worker.id, {
        schedule: [
          { day: "Tuesday", enabled: false, shift: "08:00 AM â€“ 06:00 PM" },
        ],
        serviceRadiusKm: 10,
        emergencyAvailable: false,
      });
      assert.equal(saved.serviceRadiusKm, 10);
      setSessionUser(admin);
      const summary = await analyticsService.getSummary();
      assert.equal(summary.totalWorkers, MOCK_WORKERS.length);
      assert.equal(
        summary.completedBookings,
        MOCK_BOOKINGS.filter((b) => b.status === "completed").length,
      );
    },
  );
  await t.test("all mutations are saved in isolated storage", () => {
    const saved = JSON.parse(storage.get("coopconnect.demo.v2"));
    assert.equal(
      saved.bookings.find((b) => b.id === booking.id).status,
      "completed",
    );
    assert.ok(
      saved.notifications.some(
        (n) => n.userId === customer.id && n.type === "service_completed",
      ),
    );
    assert.ok(saved.ratings.some((r) => r.bookingId === booking.id));
    assert.ok(
      saved.complaints.some(
        (c) => c.bookingId === booking.id && c.status === "resolved",
      ),
    );
  });
});
