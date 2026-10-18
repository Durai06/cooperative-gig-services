import { hydrateDemo, persistDemo } from "@/services/demoStore";
// ============================================================
// CoopConnect – Mock Authentication Service
// Simulates JWT auth. Replace with real Axios calls when
// a documented backend contract is available.
// ============================================================

import {
  MOCK_COOPERATIVES,
  MOCK_SERVICES,
  MOCK_USERS,
  MOCK_WORKERS,
} from "@/services/mockData";
import type {
  LoginPayload,
  RegisterCustomerPayload,
  RegisterWorkerPayload,
  User,
} from "@/types";

function fakeToken(userId: string): string {
  return `mock.jwt.token.${userId}.${Date.now()}`;
}

function delay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockAuthService = {
  async login(payload: LoginPayload): Promise<{ user: User; token: string }> {
    await hydrateDemo();
    await delay();
    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase(),
    );
    if (!found) throw new Error("No account found with this email address.");
    // In real API: validate hashed password server-side
    if (payload.password.length < 6) throw new Error("Invalid credentials.");
    return { user: found, token: fakeToken(found.id) };
  },

  async registerCustomer(
    payload: RegisterCustomerPayload,
  ): Promise<{ user: User; token: string }> {
    await hydrateDemo();
    await delay();
    const exists = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase(),
    );
    if (exists) throw new Error("An account with this email already exists.");

    const newUser: User = {
      id: `usr-cust-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: "customer",
      address: payload.address,
      createdAt: new Date().toISOString(),
    };
    MOCK_USERS.push(newUser);
    await persistDemo();
    return { user: newUser, token: fakeToken(newUser.id) };
  },

  async registerWorker(
    payload: RegisterWorkerPayload,
  ): Promise<{ user: User; token: string }> {
    await hydrateDemo();
    await delay();
    const exists = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase(),
    );
    if (exists) throw new Error("An account with this email already exists.");

    const newUser: User = {
      id: `usr-wkr-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: "worker",
      address: payload.serviceLocation,
      createdAt: new Date().toISOString(),
    };
    const workerId = `wkr-${Date.now()}`;
    MOCK_WORKERS.push({
      id: workerId,
      userId: newUser.id,
      user: newUser,
      cooperativeId: payload.cooperativeId,
      cooperative: MOCK_COOPERATIVES.find(
        (c) => c.id === payload.cooperativeId,
      ),
      experience: payload.experience,
      rating: 0,
      totalRatings: 0,
      availability: false,
      location: payload.serviceLocation,
      verificationStatus: "pending",
      activeJobs: 0,
      completedJobs: 0,
      earnings: 0,
      skills: payload.skills.map((skill, i) => {
        const service = MOCK_SERVICES.find(
          (s) => s.id === skill || s.category === skill,
        );
        if (!service) throw new Error("Unknown service skill.");
        return {
          id: `skill-${Date.now()}-${i}`,
          workerId,
          serviceId: service.id,
          serviceName: service.name,
        };
      }),
    });
    MOCK_USERS.push(newUser);
    await persistDemo();
    return { user: newUser, token: fakeToken(newUser.id) };
  },

  async forgotPassword(email: string): Promise<void> {
    await hydrateDemo();
    await delay(800);
    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (!found) throw new Error("No account found with this email address.");
    // In real implementation: send email via backend
  },
};
