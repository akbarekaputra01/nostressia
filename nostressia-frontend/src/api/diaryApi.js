import client, { unwrapResponse } from "./client";

export async function createDiary(data) {
  const response = await client.post("/diary/", data);
  return unwrapResponse(response);
}

export async function getMyDiaries() {
  const response = await client.get("/diary/");
  return unwrapResponse(response);
}

export async function getDiaryById(diaryId) {
  const response = await client.get(`/diary/${diaryId}`);
  return unwrapResponse(response);
}

export async function updateDiary(diaryId, data) {
  const response = await client.put(`/diary/${diaryId}`, data);
  return unwrapResponse(response);
}

// Example usage:
// const diary = await getDiaryById(123, { token: accessToken });
