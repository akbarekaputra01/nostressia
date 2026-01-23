import client, { unwrapResponse } from "./client";

export async function getTipCategories() {
  const response = await client.get("/tips/categories");
  return unwrapResponse(response);
}

export async function createTipCategory(data) {
  const response = await client.post("/tips/categories", data);
  return unwrapResponse(response);
}

export async function deleteTipCategory(categoryId) {
  const response = await client.delete(`/tips/categories/${categoryId}`);
  return unwrapResponse(response);
}

export async function getTips() {
  const response = await client.get("/tips/");
  return unwrapResponse(response);
}

export async function getTipsByCategory(categoryId) {
  const response = await client.get(`/tips/by-category/${categoryId}`);
  return unwrapResponse(response);
}

export async function getTipById(tipId) {
  const response = await client.get(`/tips/${tipId}`);
  return unwrapResponse(response);
}

export async function createTip(data) {
  const response = await client.post("/tips/", data);
  return unwrapResponse(response);
}

export async function updateTip(tipId, data) {
  const response = await client.put(`/tips/${tipId}`, data);
  return unwrapResponse(response);
}

export async function deleteTip(tipId) {
  const response = await client.delete(`/tips/${tipId}`);
  return unwrapResponse(response);
}

// Example usage:
// const tips = await getTipsByCategory(1);
