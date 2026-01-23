import client, { unwrapResponse } from "../api/client";

export const getTipCategories = async () => {
  const response = await client.get("/tips/categories");
  return unwrapResponse(response);
};

export const createTipCategory = async (payload) => {
  const response = await client.post("/tips/categories", payload);
  return unwrapResponse(response);
};

export const deleteTipCategory = async (categoryId) => {
  const response = await client.delete(`/tips/categories/${categoryId}`);
  return unwrapResponse(response);
};

export const getTips = async () => {
  const response = await client.get("/tips/");
  return unwrapResponse(response);
};

export const getTipsByCategory = async (categoryId) => {
  const response = await client.get(`/tips/by-category/${categoryId}`);
  return unwrapResponse(response);
};

export const getTipById = async (tipId) => {
  const response = await client.get(`/tips/${tipId}`);
  return unwrapResponse(response);
};

export const createTip = async (payload) => {
  const response = await client.post("/tips/", payload);
  return unwrapResponse(response);
};

export const updateTip = async (tipId, payload) => {
  const response = await client.put(`/tips/${tipId}`, payload);
  return unwrapResponse(response);
};

export const deleteTip = async (tipId) => {
  const response = await client.delete(`/tips/${tipId}`);
  return unwrapResponse(response);
};
