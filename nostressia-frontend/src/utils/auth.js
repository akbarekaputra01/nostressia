import { createLogger } from "./logger";
import { storage } from "./storage";

/**
 * Centralized auth storage helpers to keep naming consistent across the app.
 * Tokens are stored with Nostressia-specific keys to avoid collisions.
 */
const logger = createLogger("AUTH");
const ACCESS_TOKEN_KEY = "nostressia_accessToken";
const ADMIN_TOKEN_KEY = "nostressia_adminAccessToken";
const ADMIN_PROFILE_KEY = "nostressia_adminProfile";
const LEGACY_USER_TOKEN_KEYS = ["accessToken", "token", "access_token", "jwt"];
const LEGACY_ADMIN_TOKEN_KEYS = ["adminAccessToken", "adminToken", "adminAuth"];
const LEGACY_ADMIN_PROFILE_KEYS = ["adminData"];

export const AUTH_SCOPE = {
  USER: "user",
  ADMIN: "admin",
};

/**
 * Validate token values to avoid storing empty or sentinel values.
 */
const isValidTokenValue = (token) => {
  if (!token) return false;
  if (typeof token !== "string") return true;
  const normalized = token.trim().toLowerCase();
  return normalized !== "undefined" && normalized !== "null" && normalized !== "";
};

/**
 * Normalize stored token values to a nullable string.
 */
const resolveStoredToken = (token) => (isValidTokenValue(token) ? token : null);

/**
 * Remove legacy keys that hold invalid token values.
 */
const cleanupLegacyTokens = (keys) => {
  keys.forEach((key) => {
    const stored = storage.getItem(key);
    if (stored && !isValidTokenValue(stored)) {
      storage.removeItem(key);
    }
  });
};

/**
 * Expose token validation for auth flows.
 */
export const isAuthTokenValid = (token) => isValidTokenValue(token);

/**
 * Read the user access token, migrating from legacy keys when needed.
 */
export const readAuthToken = () => {
  const currentToken = resolveStoredToken(storage.getItem(ACCESS_TOKEN_KEY));
  if (currentToken) {
    cleanupLegacyTokens(LEGACY_USER_TOKEN_KEYS);
    return currentToken;
  }

  const legacyToken = LEGACY_USER_TOKEN_KEYS.map((key) =>
    resolveStoredToken(storage.getItem(key)),
  ).find(Boolean);

  if (legacyToken) {
    storage.setItem(ACCESS_TOKEN_KEY, legacyToken);
  }

  cleanupLegacyTokens([ACCESS_TOKEN_KEY, ...LEGACY_USER_TOKEN_KEYS]);
  return legacyToken || null;
};

/**
 * Persist the user access token using the canonical storage key.
 */
export const persistAuthToken = (token) => {
  if (!isValidTokenValue(token)) return;
  storage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * Clear user access tokens from storage.
 */
export const clearAuthToken = () => {
  storage.removeItem(ACCESS_TOKEN_KEY);
  LEGACY_USER_TOKEN_KEYS.forEach((key) => storage.removeItem(key));
};

/**
 * Read the admin access token, migrating from legacy keys when needed.
 */
export const readAdminToken = () => {
  const currentToken = resolveStoredToken(storage.getItem(ADMIN_TOKEN_KEY));
  if (currentToken) {
    cleanupLegacyTokens(LEGACY_ADMIN_TOKEN_KEYS);
    logger.debug("[ADMIN] readAdminToken found token");
    return currentToken;
  }

  const legacyToken = LEGACY_ADMIN_TOKEN_KEYS.map((key) =>
    resolveStoredToken(storage.getItem(key)),
  ).find(Boolean);

  if (legacyToken) {
    storage.setItem(ADMIN_TOKEN_KEY, legacyToken);
    logger.debug("[ADMIN] readAdminToken migrated legacy token");
  }

  cleanupLegacyTokens([ADMIN_TOKEN_KEY, ...LEGACY_ADMIN_TOKEN_KEYS]);
  logger.debug("[ADMIN] readAdminToken resolved token", Boolean(legacyToken));
  return legacyToken || null;
};

/**
 * Read the access token for the requested auth scope.
 */
export const readTokenForScope = (scope) =>
  scope === AUTH_SCOPE.ADMIN ? readAdminToken() : readAuthToken();

/**
 * Persist the admin access token using the canonical storage key.
 */
export const persistAdminToken = (token) => {
  if (!isValidTokenValue(token)) return;
  storage.setItem(ADMIN_TOKEN_KEY, token);
  logger.debug("[ADMIN] set token");
};

/**
 * Read the serialized admin profile, migrating from legacy keys when needed.
 */
const parseAdminProfilePayload = (payload) => {
  if (!payload) return null;
  if (typeof payload === "object") return payload;
  if (typeof payload !== "string") return null;

  try {
    return JSON.parse(payload);
  } catch (error) {
    logger.warn("Invalid admin profile payload in storage:", error);
    return null;
  }
};

export const readAdminProfile = () => {
  const storedProfile = storage.getItem(ADMIN_PROFILE_KEY);
  if (storedProfile) {
    const parsed = parseAdminProfilePayload(storedProfile);
    logger.debug("[ADMIN] readAdminProfile from storage", {
      parsed,
      hasRaw: true,
    });
    return parsed;
  }

  const legacyProfile = LEGACY_ADMIN_PROFILE_KEYS.map((key) =>
    storage.getItem(key),
  ).find(Boolean);

  if (legacyProfile) {
    storage.setItem(ADMIN_PROFILE_KEY, legacyProfile);
    logger.debug("[ADMIN] readAdminProfile migrated legacy profile");
  }

  LEGACY_ADMIN_PROFILE_KEYS.forEach((key) => storage.removeItem(key));
  const parsedLegacy = parseAdminProfilePayload(legacyProfile);
  logger.debug("[ADMIN] readAdminProfile resolved profile", {
    parsed: parsedLegacy,
    hasRaw: Boolean(legacyProfile),
  });
  return parsedLegacy;
};

/**
 * Persist the admin profile payload in storage.
 */
export const persistAdminProfile = (profile) => {
  if (!profile) return;
  const payload = JSON.stringify(profile);
  storage.setItem(ADMIN_PROFILE_KEY, payload);
  logger.debug("[ADMIN] set profile");
};

/**
 * Remove stored admin profile data.
 */
export const clearAdminProfile = () => {
  storage.removeItem(ADMIN_PROFILE_KEY);
  LEGACY_ADMIN_PROFILE_KEYS.forEach((key) => storage.removeItem(key));
};

/**
 * Determine whether the admin session is fully populated.
 */
export const hasAdminSession = () => {
  const token = readAdminToken();
  const storedProfile = readAdminProfile();
  logger.debug("[ADMIN] hasAdminSession check", {
    hasToken: Boolean(token),
    profileType: typeof storedProfile,
  });
  if (!token || !storedProfile) return false;

  return typeof storedProfile === "object";
};

/**
 * Remove all admin session artifacts (token + profile).
 */
export const clearAdminSession = () => {
  logger.warn("[ADMIN] clearAdminSession called", new Error().stack);
  storage.removeItem(ADMIN_TOKEN_KEY);
  LEGACY_ADMIN_TOKEN_KEYS.forEach((key) => storage.removeItem(key));
  clearAdminProfile();
};
