import { BASE_URL } from "./config";
import { parseJsonResponse } from "./request";

const buildAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export async function createDiary(data, { token, signal } = {}) {
  const res = await fetch(`${BASE_URL}/diary/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
    body: JSON.stringify(data),
    signal,
  });
  return parseJsonResponse(res);
}

export async function getMyDiaries({ token, signal } = {}) {
  const res = await fetch(`${BASE_URL}/diary/`, {
    method: "GET",
    headers: { ...buildAuthHeaders(token) },
    signal,
  });
  return parseJsonResponse(res);
}

export async function getDiaryById(diaryId, { token, signal } = {}) {
  const res = await fetch(`${BASE_URL}/diary/${diaryId}`, {
    method: "GET",
    headers: { ...buildAuthHeaders(token) },
    signal,
  });
  return parseJsonResponse(res);
}

export async function updateDiary(diaryId, data, { token, signal } = {}) {
  const res = await fetch(`${BASE_URL}/diary/${diaryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
    body: JSON.stringify(data),
    signal,
  });
  return parseJsonResponse(res);
}

// Example usage:
// const diary = await getDiaryById(123, { token: accessToken });
