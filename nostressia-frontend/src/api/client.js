import axios from "axios";

import { readAuthToken } from "../utils/auth";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, "");
const apiBaseUrl = normalizedBaseUrl
  ? normalizedBaseUrl.endsWith("/api")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api`
  : "/api";

const resolveApiOrigin = (baseUrl) => {
  if (!baseUrl) {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
    return new URL(baseUrl).origin;
  }
  return typeof window !== "undefined" ? window.location.origin : "";
};

export const apiOrigin = resolveApiOrigin(normalizedBaseUrl);

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  if (config?.auth === false) {
    return config;
  }

  const token = config?.auth === "admin"
    ? localStorage.getItem("adminToken")
    : readAuthToken();

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

client.interceptors.response.use(
  (response) => {
    if (response?.data?.success === false) {
      const error = new Error(response?.data?.message || "Request failed");
      error.status = response?.status;
      error.payload = response?.data;
      return Promise.reject(error);
    }

    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const payload = error?.response?.data;
    const message =
      payload?.message ||
      payload?.detail ||
      (Array.isArray(payload?.data) ? "Validation error" : null) ||
      error.message ||
      "Request failed";

    const normalizedError = new Error(message);
    normalizedError.status = status;
    normalizedError.payload = payload;

    const shouldRedirect = status === 401 && !error?.config?.skipAuthRedirect;
    if (shouldRedirect && typeof window !== "undefined") {
      const isAdmin =
        error?.config?.auth === "admin" ||
        error?.config?.url?.includes("/admin");
      window.location.assign(isAdmin ? "/admin/login" : "/login");
    }

    return Promise.reject(normalizedError);
  }
);

export const unwrapResponse = (response) => response?.data?.data ?? response?.data;

export default client;
