import client from "./client";
import { apiResponseSchema, parseApiResponse } from "./contracts/apiResponse";
import { diaryListSchema, diaryResponseSchema } from "./contracts/diarySchemas";

const diaryListResponseSchema = apiResponseSchema(diaryListSchema);
const diaryResponseApiSchema = apiResponseSchema(diaryResponseSchema);

export async function createDiary(data) {
  const response = await client.post("/diary/", data);
  return parseApiResponse(diaryResponseApiSchema, response.data);
}

export async function getMyDiaries() {
  const response = await client.get("/diary/");
  return parseApiResponse(diaryListResponseSchema, response.data);
}

export async function getDiaryById(diaryId) {
  const response = await client.get(`/diary/${diaryId}`);
  return parseApiResponse(diaryResponseApiSchema, response.data);
}

export async function updateDiary(diaryId, data) {
  const response = await client.put(`/diary/${diaryId}`, data);
  return parseApiResponse(diaryResponseApiSchema, response.data);
}

// Example usage:
// const diary = await getDiaryById(123, { token: accessToken });
