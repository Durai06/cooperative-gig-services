// ============================================================
// CoopConnect – Authentication Service (Strict Backend Driven)
// Direct FastAPI communication; requires running backend server.
// ============================================================

import { apiClient } from "@/services/api/client";
import { setSessionToken, setSessionUser } from "@/services/session";
import type {
  LoginPayload,
  RegisterCustomerPayload,
  RegisterWorkerPayload,
  User,
} from "@/types";

export const authService = {
  async login(payload: LoginPayload): Promise<{ user: User; token: string }> {
    const res = await apiClient.post("/auth/login", payload);
    const { user, token } = res.data;
    if (token) {
      setSessionToken(token);
    }
    if (user) {
      setSessionUser(user);
    }
    return { user, token };
  },

  async registerCustomer(
    payload: RegisterCustomerPayload,
  ): Promise<{ user: User; token: string }> {
    const res = await apiClient.post("/auth/register-customer", payload);
    const { user, token } = res.data;
    if (token) {
      setSessionToken(token);
    }
    if (user) {
      setSessionUser(user);
    }
    return { user, token };
  },

  async registerWorker(
    payload: RegisterWorkerPayload,
  ): Promise<{ user: User; token: string }> {
    const res = await apiClient.post("/auth/register-worker", payload);
    const { user, token } = res.data;
    if (token) {
      setSessionToken(token);
    }
    if (user) {
      setSessionUser(user);
    }
    return { user, token };
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email });
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get("/auth/me");
    return res.data.user;
  },

  async updateProfile(payload: {
    name?: string;
    phone?: string;
    address?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const res = await apiClient.patch("/auth/profile", payload);
    return res.data.user;
  },
};

// Alias for backwards compatibility across existing screen imports
export const mockAuthService = authService;
