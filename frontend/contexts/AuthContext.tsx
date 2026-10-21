// ============================================================
// CoopConnect – Auth Context & Provider
// Cross-platform session persistence (SecureStore on mobile,
// localStorage on web).
// Backend-only mode: no local mock data is hydrated.
// ============================================================

import { authService } from "@/services/api/authService";
import { setOnUnauthorizedCallback } from "@/services/api/client";
import { setSessionUser } from "@/services/session";
import { setSessionToken } from "@/services/session";
import type {
  AuthState,
  LoginPayload,
  RegisterCustomerPayload,
  RegisterWorkerPayload,
  User,
  UserRole,
} from "@/types";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { Platform } from "react-native";

// ─── Cross-Platform Storage Helper ────────────────────────────

const TOKEN_KEY = "coopconnect_token";
const USER_KEY = "coopconnect_user";
const ONBOARDED_KEY = "coopconnect_onboarded";

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return typeof window !== "undefined" ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") localStorage.setItem(key, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") localStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

// ─── Actions ─────────────────────────────────────────────────

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: User };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "UPDATE_USER":
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

export const DEMO_CREDENTIALS: Record<UserRole, LoginPayload> = {
  customer: { email: "customer@coopconnect.in", password: "password123" },
  worker: { email: "worker@coopconnect.in", password: "password123" },
  admin: { email: "admin@coopconnect.in", password: "password123" },
};

// ─── Context ─────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<User>;
  registerCustomer: (payload: RegisterCustomerPayload) => Promise<User>;
  registerWorker: (payload: RegisterWorkerPayload) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  switchRole: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const logout = useCallback(async () => {
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    setSessionToken(null);
    setSessionUser(null);
    dispatch({ type: "LOGOUT" });
  }, []);

  // Restore and validate session on mount (backend-only: validates token with backend)
  useEffect(() => {
    let isCancelled = false;

    // Auto-logout if any API request encounters HTTP 401 Unauthorized
    setOnUnauthorizedCallback(() => {
      logout();
    });

    (async () => {
      try {
        const token = await storage.getItem(TOKEN_KEY);
        const onboarded = await storage.getItem(ONBOARDED_KEY);

        if (onboarded === "true") {
          setHasCompletedOnboarding(true);
        }

        if (token) {
          setSessionToken(token);
          try {
            // Verify token against backend /auth/me
            const verifiedUser = await authService.getMe();
            if (!isCancelled) {
              setSessionUser(verifiedUser);
              await storage.setItem(USER_KEY, JSON.stringify(verifiedUser));
              dispatch({
                type: "LOGIN_SUCCESS",
                payload: { user: verifiedUser, token },
              });
            }
          } catch {
            // Token is invalid, expired, or backend was reset: wipe invalid credentials completely
            if (!isCancelled) {
              await storage.deleteItem(TOKEN_KEY);
              await storage.deleteItem(USER_KEY);
              setSessionToken(null);
              setSessionUser(null);
              dispatch({ type: "LOGOUT" });
            }
          }
        } else {
          if (!isCancelled) {
            dispatch({ type: "SET_LOADING", payload: false });
          }
        }
      } catch {
        if (!isCancelled) {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      }
    })();

    return () => {
      isCancelled = true;
      setOnUnauthorizedCallback(null);
    };
  }, [logout]);

  const completeOnboarding = useCallback(async () => {
    await storage.setItem(ONBOARDED_KEY, "true");
    setHasCompletedOnboarding(true);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const { user, token } = await authService.login(payload);
      await storage.setItem(TOKEN_KEY, token);
      await storage.setItem(USER_KEY, JSON.stringify(user));
      await storage.setItem(ONBOARDED_KEY, "true");
      setHasCompletedOnboarding(true);
      setSessionToken(token);
      setSessionUser(user);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
      return user;
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: false });
      throw err;
    }
  }, []);

  const switchRole = useCallback(async (role: UserRole) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const creds = DEMO_CREDENTIALS[role];
      const { user, token } = await authService.login(creds);
      await storage.setItem(TOKEN_KEY, token);
      await storage.setItem(USER_KEY, JSON.stringify(user));
      setSessionToken(token);
      setSessionUser(user);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
      return user;
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: false });
      throw err;
    }
  }, []);

  const registerCustomer = useCallback(
    async (payload: RegisterCustomerPayload) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const { user, token } = await authService.registerCustomer(payload);
        await storage.setItem(TOKEN_KEY, token);
        await storage.setItem(USER_KEY, JSON.stringify(user));
        await storage.setItem(ONBOARDED_KEY, "true");
        setHasCompletedOnboarding(true);
        setSessionToken(token);
        setSessionUser(user);
        dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
        return user;
      } catch (err) {
        dispatch({ type: "SET_LOADING", payload: false });
        throw err;
      }
    },
    [],
  );

  const registerWorker = useCallback(async (payload: RegisterWorkerPayload) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const { user, token } = await authService.registerWorker(payload);
      await storage.setItem(TOKEN_KEY, token);
      await storage.setItem(USER_KEY, JSON.stringify(user));
      await storage.setItem(ONBOARDED_KEY, "true");
      setHasCompletedOnboarding(true);
      setSessionToken(token);
      setSessionUser(user);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
      return user;
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: false });
      throw err;
    }
  }, []);


  const updateUser = useCallback((user: User) => {
    setSessionUser(user);
    dispatch({ type: "UPDATE_USER", payload: user });
    storage.setItem(USER_KEY, JSON.stringify(user)).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        hasCompletedOnboarding,
        completeOnboarding,
        login,
        registerCustomer,
        registerWorker,
        logout,
        updateUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
