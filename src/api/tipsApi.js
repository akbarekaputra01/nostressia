import { BASE_URL } from "./config";
import { parseJsonResponse } from "./request";

export async function getTipCategories({ signal } = {}) {
  const res = await fetch(`${BASE_URL}/tips/categories`, { signal });
  return parseJsonResponse(res);
}

export async function createTipCategory(data, { signal } = {}) {
  const res = await fetch(`${BASE_URL}/tips/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });
  return parseJsonResponse(res);
}

export async function deleteTipCategory(categoryId, { signal } = {}) {
  const res = await fetch(`${BASE_URL}/tips/categories/${categoryId}`, {
    method: "DELETE",
    signal,
  });
  return parseJsonResponse(res);
}

export async function getTips({ signal } = {}) {
  const res = await fetch(`${BASE_URL}/tips/`, { signal });
  return parseJsonResponse(res);
}

export async function getTipsByCategory(categoryId, { signal } = {}) {
  const res = await fetch(`${BASE_URL}/tips/by-category/${categoryId}`, {
    signal,
  });
  return parseJsonResponse(res);
}

export async function getTipById(tipId, { signal } = {}) {
  const res = await fetch(`${BASE_URL}/tips/${tipId}`, { signal });
  return parseJsonResponse(res);
}

export async function createTip(data, { signal } = {}) {
  const res = await fetch(`${BASE_URL}/tips/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });
  return parseJsonResponse(res);
}

export async function updateTip(tipId, data, { signal } = {}) {
  const res = await fetch(`${BASE_URL}/tips/${tipId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });
  return parseJsonResponse(res);
}

export async function deleteTip(tipId, { signal } = {}) {
  const res = await fetch(`${BASE_URL}/tips/${tipId}`, {
    method: "DELETE",
    signal,
  });
  return parseJsonResponse(res);
}

// Example usage:
// const tips = await getTipsByCategory(1);
