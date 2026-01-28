import axios from "axios";

import { clearAdminSession, clearAuthToken, readAdminToken, readAuthToken } from "../utils/auth";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, "");
const isAbsoluteUrl = /^https?:\/\//i.test(normalizedBaseUrl);
const apiBaseUrl = normalizedBaseUrl
  ? normalizedBaseUrl.endsWith("/api")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api`
  : "/api";

export const apiOrigin = normalizedBaseUrl
  ? isAbsoluteUrl
    ? new URL(normalizedBaseUrl).origin
    : typeof window !== "undefined"
    ? window.location.origin
    : ""
  : typeof window !== "undefined"
  ? window.location.origin
  : "";

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
    ? readAdminToken()
    : readAuthToken();

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

/**
 * Avoid redundant redirects when the user is already on the relevant login page.
 */
const shouldRedirectToLogin = (isAdmin, currentPath) => {
  const adminLoginPath = "/admin/login";
  const userLoginPath = "/login";
  const targetPath = isAdmin ? adminLoginPath : userLoginPath;

  if (!currentPath) {
    return true;
  }

  return currentPath !== targetPath;
};

/**
 * Clear local auth state to prevent login redirect loops after a 401.
 */
const handleUnauthorized = (isAdmin) => {
  if (isAdmin) {
    clearAdminSession();
  } else {
    clearAuthToken();
  }
};

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
      handleUnauthorized(isAdmin);
      const currentPath = window.location?.pathname;
      if (shouldRedirectToLogin(isAdmin, currentPath)) {
        window.location.assign(isAdmin ? "/admin/login" : "/login");
      }
    }

    return Promise.reject(normalizedError);
  }
);

export const unwrapResponse = (response) => response?.data?.data ?? response?.data;

export default client;
