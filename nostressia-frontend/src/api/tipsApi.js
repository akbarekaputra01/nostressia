import client from "./client";
import { apiResponseSchema, parseApiResponse } from "./contracts/apiResponse";
import {
  tipsCategoryListSchema,
  tipsCategorySchema,
  tipsListSchema,
  tipsResponseSchema,
} from "./contracts/tipsSchemas";
import { z } from "zod";

const tipsCategoryListResponseSchema = apiResponseSchema(tipsCategoryListSchema);
const tipsCategoryResponseSchema = apiResponseSchema(tipsCategorySchema);
const tipsListResponseSchema = apiResponseSchema(tipsListSchema);
const tipsResponseApiSchema = apiResponseSchema(tipsResponseSchema);
const emptyResponseSchema = apiResponseSchema(z.null());

export async function getTipCategories() {
  const response = await client.get("/tips/categories");
  return parseApiResponse(tipsCategoryListResponseSchema, response.data);
}

export async function createTipCategory(data) {
  const response = await client.post("/tips/categories", data);
  return parseApiResponse(tipsCategoryResponseSchema, response.data);
}

export async function deleteTipCategory(categoryId) {
  const response = await client.delete(`/tips/categories/${categoryId}`);
  return parseApiResponse(emptyResponseSchema, response.data);
}

export async function getTips() {
  const response = await client.get("/tips/");
  return parseApiResponse(tipsListResponseSchema, response.data);
}

export async function getTipsByCategory(categoryId) {
  const response = await client.get(`/tips/by-category/${categoryId}`);
  return parseApiResponse(tipsListResponseSchema, response.data);
}

export async function getTipById(tipId) {
  const response = await client.get(`/tips/${tipId}`);
  return parseApiResponse(tipsResponseApiSchema, response.data);
}

export async function createTip(data) {
  const response = await client.post("/tips/", data);
  return parseApiResponse(tipsResponseApiSchema, response.data);
}

export async function updateTip(tipId, data) {
  const response = await client.put(`/tips/${tipId}`, data);
  return parseApiResponse(tipsResponseApiSchema, response.data);
}

export async function deleteTip(tipId) {
  const response = await client.delete(`/tips/${tipId}`);
  return parseApiResponse(emptyResponseSchema, response.data);
}

// Example usage:
// const tips = await getTipsByCategory(1);
