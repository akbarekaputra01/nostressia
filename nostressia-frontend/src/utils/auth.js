const isValidTokenValue = (token) => {
  if (!token) return false;
  if (typeof token !== "string") return true;
  const normalized = token.trim().toLowerCase();
  return normalized !== "undefined" && normalized !== "null" && normalized !== "";
};

const resolveStoredToken = (token) => (isValidTokenValue(token) ? token : null);

export const isAuthTokenValid = (token) => isValidTokenValue(token);

export const readAuthToken = () => {
  const token =
    resolveStoredToken(localStorage.getItem("token")) ||
    resolveStoredToken(localStorage.getItem("access_token")) ||
    resolveStoredToken(localStorage.getItem("accessToken")) ||
    resolveStoredToken(localStorage.getItem("jwt"));

  if (!token) {
    ["token", "access_token", "accessToken", "jwt"].forEach((key) => {
      const stored = localStorage.getItem(key);
      if (stored && !isValidTokenValue(stored)) {
        localStorage.removeItem(key);
      }
    });
  }

  return token;
};

export const persistAuthToken = (token) => {
  if (!isValidTokenValue(token)) return;
  localStorage.setItem("token", token);
  localStorage.setItem("access_token", token);
  localStorage.setItem("accessToken", token);
  localStorage.setItem("jwt", token);
};
