import client from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import { diaryListSchema, diaryResponseSchema } from "../api/contracts/diarySchemas";

const diaryListResponseSchema = apiResponseSchema(diaryListSchema);
const diaryResponseApiSchema = apiResponseSchema(diaryResponseSchema);

export const getMyDiaries = async () => {
  const response = await client.get("/diary/");
  return parseApiResponse(diaryListResponseSchema, response.data);
};

export const getDiaryById = async (diaryId) => {
  const response = await client.get(`/diary/${diaryId}`);
  return parseApiResponse(diaryResponseApiSchema, response.data);
};

export const createDiary = async (payload) => {
  const response = await client.post("/diary/", payload);
  return parseApiResponse(diaryResponseApiSchema, response.data);
};

export const updateDiary = async (diaryId, payload) => {
  const response = await client.put(`/diary/${diaryId}`, payload);
  return parseApiResponse(diaryResponseApiSchema, response.data);
};
