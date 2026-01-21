import { BASE_URL } from "./config";

const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("jwt");

export async function fetchGlobalForecast({ token, signal } = {}) {
  const resolvedToken = token || getAuthToken();
  if (!resolvedToken) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${BASE_URL}/predict/global-forecast`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolvedToken}`,
    },
    signal,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.message;
    const error = new Error(
      detail ? String(detail) : `Request failed (HTTP ${response.status}).`
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
