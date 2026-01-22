import { BASE_URL } from "./config";
import { parseJsonResponse } from "./request";

const buildAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export async function addStressLog(data, { token, signal } = {}) {
  const res = await fetch(`${BASE_URL}/stress-levels/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
    body: JSON.stringify(data),
    signal,
  });
  return parseJsonResponse(res);
}

export async function restoreStressLog(data, { token, signal } = {}) {
  const res = await fetch(`${BASE_URL}/stress-levels/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
    body: JSON.stringify(data),
    signal,
  });
  return parseJsonResponse(res);
}

export async function getMyStressLogs({ token, signal } = {}) {
  const res = await fetch(`${BASE_URL}/stress-levels/my-logs`, {
    method: "GET",
    headers: { ...buildAuthHeaders(token) },
    signal,
  });
  return parseJsonResponse(res);
}

export async function getStressEligibility({ token, signal } = {}) {
  const res = await fetch(`${BASE_URL}/stress-levels/eligibility`, {
    method: "GET",
    headers: { ...buildAuthHeaders(token) },
    signal,
  });
  return parseJsonResponse(res);
}

// Example usage:
// const eligibility = await getStressEligibility({ token: accessToken });
