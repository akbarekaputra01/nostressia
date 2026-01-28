/**
 * Centralized auth storage helpers to keep naming consistent across the app.
 * Tokens are stored with Nostressia-specific keys to avoid collisions.
 */
const ACCESS_TOKEN_KEY = "nostressia_accessToken";
const ADMIN_TOKEN_KEY = "nostressia_adminAccessToken";
const ADMIN_PROFILE_KEY = "nostressia_adminProfile";
const LEGACY_USER_TOKEN_KEYS = ["accessToken", "token", "access_token", "jwt"];
const LEGACY_ADMIN_TOKEN_KEYS = ["adminAccessToken", "adminToken", "adminAuth"];
const LEGACY_ADMIN_PROFILE_KEYS = ["adminData"];

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
    const stored = localStorage.getItem(key);
    if (stored && !isValidTokenValue(stored)) {
      localStorage.removeItem(key);
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
  const currentToken = resolveStoredToken(localStorage.getItem(ACCESS_TOKEN_KEY));
  if (currentToken) {
    cleanupLegacyTokens(LEGACY_USER_TOKEN_KEYS);
    return currentToken;
  }

  const legacyToken = LEGACY_USER_TOKEN_KEYS.map((key) =>
    resolveStoredToken(localStorage.getItem(key)),
  ).find(Boolean);

  if (legacyToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, legacyToken);
  }

  cleanupLegacyTokens([ACCESS_TOKEN_KEY, ...LEGACY_USER_TOKEN_KEYS]);
  return legacyToken || null;
};

/**
 * Persist the user access token using the canonical storage key.
 */
export const persistAuthToken = (token) => {
  if (!isValidTokenValue(token)) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * Clear user access tokens from storage.
 */
export const clearAuthToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  LEGACY_USER_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
};

/**
 * Read the admin access token, migrating from legacy keys when needed.
 */
export const readAdminToken = () => {
  const currentToken = resolveStoredToken(localStorage.getItem(ADMIN_TOKEN_KEY));
  if (currentToken) {
    cleanupLegacyTokens(LEGACY_ADMIN_TOKEN_KEYS);
    return currentToken;
  }

  const legacyToken = LEGACY_ADMIN_TOKEN_KEYS.map((key) =>
    resolveStoredToken(localStorage.getItem(key)),
  ).find(Boolean);

  if (legacyToken) {
    localStorage.setItem(ADMIN_TOKEN_KEY, legacyToken);
  }

  cleanupLegacyTokens([ADMIN_TOKEN_KEY, ...LEGACY_ADMIN_TOKEN_KEYS]);
  return legacyToken || null;
};

/**
 * Persist the admin access token using the canonical storage key.
 */
export const persistAdminToken = (token) => {
  if (!isValidTokenValue(token)) return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

/**
 * Read the serialized admin profile, migrating from legacy keys when needed.
 */
export const readAdminProfile = () => {
  const storedProfile = localStorage.getItem(ADMIN_PROFILE_KEY);
  if (storedProfile) {
    return storedProfile;
  }

  const legacyProfile = LEGACY_ADMIN_PROFILE_KEYS.map((key) =>
    localStorage.getItem(key),
  ).find(Boolean);

  if (legacyProfile) {
    localStorage.setItem(ADMIN_PROFILE_KEY, legacyProfile);
  }

  LEGACY_ADMIN_PROFILE_KEYS.forEach((key) => localStorage.removeItem(key));
  return legacyProfile || null;
};

/**
 * Persist the admin profile payload in storage.
 */
export const persistAdminProfile = (profile) => {
  if (!profile) return;
  const payload = typeof profile === "string" ? profile : JSON.stringify(profile);
  localStorage.setItem(ADMIN_PROFILE_KEY, payload);
};

/**
 * Remove stored admin profile data.
 */
export const clearAdminProfile = () => {
  localStorage.removeItem(ADMIN_PROFILE_KEY);
  LEGACY_ADMIN_PROFILE_KEYS.forEach((key) => localStorage.removeItem(key));
};

/**
 * Determine whether the admin session is fully populated.
 */
export const hasAdminSession = () => Boolean(readAdminToken() && readAdminProfile());

/**
 * Remove all admin session artifacts (token + profile).
 */
export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  LEGACY_ADMIN_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  clearAdminProfile();
};
