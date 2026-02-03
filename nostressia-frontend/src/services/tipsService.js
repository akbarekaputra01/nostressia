import client from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import {
  tipsCategoryListSchema,
  tipsCategorySchema,
  tipsListSchema,
  tipsResponseSchema,
} from "../api/contracts/tipsSchemas";
import { z } from "zod";

const tipsCategoryListResponseSchema = apiResponseSchema(tipsCategoryListSchema);
const tipsCategoryResponseSchema = apiResponseSchema(tipsCategorySchema);
const tipsListResponseSchema = apiResponseSchema(tipsListSchema);
const tipsResponseApiSchema = apiResponseSchema(tipsResponseSchema);
const emptyResponseSchema = apiResponseSchema(z.null());

export const getTipCategories = async () => {
  const response = await client.get("/tips/categories");
  return parseApiResponse(tipsCategoryListResponseSchema, response.data);
};

export const createTipCategory = async (payload) => {
  const response = await client.post("/tips/categories", payload);
  return parseApiResponse(tipsCategoryResponseSchema, response.data);
};

export const deleteTipCategory = async (categoryId) => {
  const response = await client.delete(`/tips/categories/${categoryId}`);
  return parseApiResponse(emptyResponseSchema, response.data);
};

export const getTips = async () => {
  const response = await client.get("/tips/");
  return parseApiResponse(tipsListResponseSchema, response.data);
};

export const getTipsByCategory = async (categoryId) => {
  const response = await client.get(`/tips/by-category/${categoryId}`);
  return parseApiResponse(tipsListResponseSchema, response.data);
};

export const getTipById = async (tipId) => {
  const response = await client.get(`/tips/${tipId}`);
  return parseApiResponse(tipsResponseApiSchema, response.data);
};

export const createTip = async (payload) => {
  const response = await client.post("/tips/", payload);
  return parseApiResponse(tipsResponseApiSchema, response.data);
};

export const updateTip = async (tipId, payload) => {
  const response = await client.put(`/tips/${tipId}`, payload);
  return parseApiResponse(tipsResponseApiSchema, response.data);
};

export const deleteTip = async (tipId) => {
  const response = await client.delete(`/tips/${tipId}`);
  return parseApiResponse(emptyResponseSchema, response.data);
};
