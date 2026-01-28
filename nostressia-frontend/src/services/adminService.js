import { adminClient, unwrapResponse } from "../api/client";

export const getAdminUsers = async (params) => {
  const response = await adminClient.get("/admin/users/", { params, auth: "admin" });
  return unwrapResponse(response);
};

export const getAdminUser = async (userId) => {
  const response = await adminClient.get(`/admin/users/${userId}`, { auth: "admin" });
  return unwrapResponse(response);
};

export const updateAdminUser = async (userId, payload) => {
  const response = await adminClient.put(`/admin/users/${userId}`, payload, { auth: "admin" });
  return unwrapResponse(response);
};

export const deleteAdminUser = async (userId) => {
  const response = await adminClient.delete(`/admin/users/${userId}`, { auth: "admin" });
  return unwrapResponse(response);
};

export const getAdminDiaries = async (params) => {
  const response = await adminClient.get("/admin/diaries/", { params, auth: "admin" });
  return unwrapResponse(response);
};

export const deleteAdminDiary = async (diaryId) => {
  const response = await adminClient.delete(`/admin/diaries/${diaryId}`, { auth: "admin" });
  return unwrapResponse(response);
};
