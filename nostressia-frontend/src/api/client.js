import axios from "axios";

import {
  AUTH_SCOPE,
  clearAdminSession,
  clearAuthToken,
  readTokenForScope,
} from "../utils/auth";
import { createLogger } from "../utils/logger";

const logger = createLogger("API");

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

const createApiClient = ({ authMode = AUTH_SCOPE.USER } = {}) => {
  const instance = axios.create({
    baseURL: apiBaseUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use((config) => {
    const resolvedAuth = config?.authScope ?? config?.auth ?? authMode;
    if (resolvedAuth === false) {
      return config;
    }

    const token = readTokenForScope(resolvedAuth);

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    if (typeof config?.auth === "string" || typeof config?.auth === "boolean") {
      delete config.auth;
    }

    return config;
  });

  /**
   * Clear local auth state to prevent login redirect loops after a 401.
   */
  const handleUnauthorized = (mode) => {
    if (mode === AUTH_SCOPE.ADMIN) {
      clearAdminSession();
    } else {
      clearAuthToken();
    }
  };

  const isInvalidTokenResponse = (payload, message) => {
    const combined = [message, payload?.message, payload?.detail]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return /(token|jwt|expired|invalid)/i.test(combined);
  };

  const shouldLogAdminUnauthorized = (config, status) => {
    if (status !== 401) return false;
    const resolvedAuth = config?.authScope ?? config?.auth ?? authMode;
    if (resolvedAuth !== AUTH_SCOPE.ADMIN) return false;
    const requestUrl = config?.url ?? "";
    return requestUrl.includes("/admin");
  };

  instance.interceptors.response.use(
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
      const message = payload?.message || error.message || "Request failed";

      const normalizedError = new Error(message);
      normalizedError.status = status;
      normalizedError.payload = payload;

      const resolvedAuth = error?.config?.authScope ?? error?.config?.auth ?? authMode;
      const token = resolvedAuth === false ? null : readTokenForScope(resolvedAuth);
      const isTokenInvalid = status === 401 && isInvalidTokenResponse(payload, message);
      const shouldClearSession =
        status === 401 &&
        Boolean(token) &&
        resolvedAuth !== false &&
        (isTokenInvalid || resolvedAuth === AUTH_SCOPE.ADMIN);
      const shouldRedirect =
        shouldClearSession &&
        !error?.config?.skipAuthRedirect &&
        (isTokenInvalid || resolvedAuth === AUTH_SCOPE.ADMIN);

      if (shouldLogAdminUnauthorized(error?.config, status)) {
        logger.warn("[AUTH][ADMIN] 401 response", {
          url: error?.config?.url,
          message,
          tokenPresent: Boolean(token),
          tokenInvalid: isTokenInvalid,
        });
      }

      if (shouldClearSession) {
        handleUnauthorized(resolvedAuth);
      }

      if (shouldRedirect && typeof window !== "undefined") {
        const isAdmin = resolvedAuth === AUTH_SCOPE.ADMIN;
        const currentPath = window.location?.pathname;
        if (shouldRedirectToLogin(isAdmin, currentPath)) {
          window.location.assign(isAdmin ? "/admin/login" : "/login");
        }
      }

      return Promise.reject(normalizedError);
    }
  );

  return instance;
};

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

export const unwrapResponse = (response) => {
  const payload = response?.data;
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new Error("Invalid API response: missing data wrapper");
  }
  return payload.data;
};

const client = createApiClient({ authMode: AUTH_SCOPE.USER });
export const adminClient = createApiClient({ authMode: AUTH_SCOPE.ADMIN });

export default client;
