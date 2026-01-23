import client, { unwrapResponse } from "../api/client";

export const getMyDiaries = async () => {
  const response = await client.get("/diary/");
  return unwrapResponse(response);
};

export const getDiaryById = async (diaryId) => {
  const response = await client.get(`/diary/${diaryId}`);
  return unwrapResponse(response);
};

export const createDiary = async (payload) => {
  const response = await client.post("/diary/", payload);
  return unwrapResponse(response);
};

export const updateDiary = async (diaryId, payload) => {
  const response = await client.put(`/diary/${diaryId}`, payload);
  return unwrapResponse(response);
};
