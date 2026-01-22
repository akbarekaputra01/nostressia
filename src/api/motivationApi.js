import { BASE_URL } from "./config";
import { parseJsonResponse } from "./request";

export async function getAllMotivations({ signal } = {}) {
  const res = await fetch(`${BASE_URL}/motivations`, { signal });
  return parseJsonResponse(res);
}

export async function createMotivation(data, { signal } = {}) {
  const res = await fetch(`${BASE_URL}/motivations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });
  return parseJsonResponse(res);
}

export async function deleteMotivation(motivationId, { signal } = {}) {
  const res = await fetch(`${BASE_URL}/motivations/${motivationId}`, {
    method: "DELETE",
    signal,
  });
  return parseJsonResponse(res);
}
