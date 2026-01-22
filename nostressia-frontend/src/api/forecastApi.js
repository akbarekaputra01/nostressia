import { BASE_URL } from "./config";
import { parseJsonResponse } from "./request";

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

  return parseJsonResponse(response);
}

export async function fetchForecastGlobal({ token, signal } = {}) {
  const resolvedToken = token || getAuthToken();
  if (!resolvedToken) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${BASE_URL}/forecast/global`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolvedToken}`,
    },
    signal,
  });

  return parseJsonResponse(response);
}
