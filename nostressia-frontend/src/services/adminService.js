import { adminClient } from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import { adminDiaryListSchema, adminUserListSchema } from "../api/contracts/adminSchemas";
import { userResponseSchema } from "../api/contracts/authSchemas";
import { z } from "zod";

const adminUserListResponseSchema = apiResponseSchema(adminUserListSchema);
const adminUserResponseSchema = apiResponseSchema(userResponseSchema);
const adminDiaryListResponseSchema = apiResponseSchema(adminDiaryListSchema);
const emptyResponseSchema = apiResponseSchema(z.null());

export const getAdminUsers = async (params) => {
  const response = await adminClient.get("/admin/users/", {
    params,
    authScope: "admin",
  });
  return parseApiResponse(adminUserListResponseSchema, response.data);
};

export const getAdminUser = async (userId) => {
  const response = await adminClient.get(`/admin/users/${userId}`, {
    authScope: "admin",
  });
  return parseApiResponse(adminUserResponseSchema, response.data);
};

export const updateAdminUser = async (userId, payload) => {
  const response = await adminClient.put(`/admin/users/${userId}`, payload, {
    authScope: "admin",
  });
  return parseApiResponse(adminUserResponseSchema, response.data);
};

export const deleteAdminUser = async (userId) => {
  const response = await adminClient.delete(`/admin/users/${userId}`, {
    authScope: "admin",
  });
  return parseApiResponse(emptyResponseSchema, response.data);
};

export const getAdminDiaries = async (params) => {
  const response = await adminClient.get("/admin/diaries/", {
    params,
    authScope: "admin",
  });
  return parseApiResponse(adminDiaryListResponseSchema, response.data);
};

export const deleteAdminDiary = async (diaryId) => {
  const response = await adminClient.delete(`/admin/diaries/${diaryId}`, {
    authScope: "admin",
  });
  return parseApiResponse(emptyResponseSchema, response.data);
};
