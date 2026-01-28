const ACCESS_TOKEN_KEY = "accessToken";
const ADMIN_TOKEN_KEY = "adminAccessToken";
const LEGACY_USER_TOKEN_KEYS = ["token", "access_token", "jwt"];

const isValidTokenValue = (token) => {
  if (!token) return false;
  if (typeof token !== "string") return true;
  const normalized = token.trim().toLowerCase();
  return normalized !== "undefined" && normalized !== "null" && normalized !== "";
};

const resolveStoredToken = (token) => (isValidTokenValue(token) ? token : null);

const cleanupLegacyTokens = (keys) => {
  keys.forEach((key) => {
    const stored = localStorage.getItem(key);
    if (stored && !isValidTokenValue(stored)) {
      localStorage.removeItem(key);
    }
  });
};

export const isAuthTokenValid = (token) => isValidTokenValue(token);

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

export const persistAuthToken = (token) => {
  if (!isValidTokenValue(token)) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  LEGACY_USER_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const readAdminToken = () =>
  resolveStoredToken(localStorage.getItem(ADMIN_TOKEN_KEY));

export const persistAdminToken = (token) => {
  if (!isValidTokenValue(token)) return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminAuth");
  localStorage.removeItem("adminData");
};
