import axios from "axios";
import { API_BASE_URL } from "@/constants";
import { getSessionToken } from "@/services/session";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Bearer token to all requests if present
apiClient.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clean error message extraction with clear backend connection messaging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      const message = typeof detail === "string" ? detail : JSON.stringify(detail);
      return Promise.reject(new Error(message));
    }
    // Handle network / connection refused errors when backend is offline
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error") ||
      !error.response
    ) {
      return Promise.reject(
        new Error(
          `Cannot connect to backend server at ${API_BASE_URL}. The backend must be running! (Start with: cd backend && python run.py)`
        )
      );
    }
    return Promise.reject(error);
  }
);

/**
 * Checks backend health directly.
 */
export async function checkBackendHealth(): Promise<{ ok: boolean; status?: string }> {
  try {
    const healthUrl = API_BASE_URL.replace(/\/api\/?$/, "/health");
    const res = await axios.get(healthUrl, { timeout: 2000 });
    return { ok: res.status === 200, status: res.data?.status };
  } catch {
    return { ok: false };
  }
}
