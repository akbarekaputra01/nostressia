import client from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import {
  motivationListSchema,
  motivationResponseSchema,
} from "../api/contracts/motivationSchemas";
import { z } from "zod";

const motivationListResponseSchema = apiResponseSchema(motivationListSchema);
const motivationResponseApiSchema = apiResponseSchema(motivationResponseSchema);
const emptyResponseSchema = apiResponseSchema(z.null());

export const getMotivations = async () => {
  const response = await client.get("/motivations/");
  return parseApiResponse(motivationListResponseSchema, response.data);
};

export const createMotivation = async (payload) => {
  const response = await client.post("/motivations/", payload);
  return parseApiResponse(motivationResponseApiSchema, response.data);
};

export const deleteMotivation = async (motivationId) => {
  const response = await client.delete(`/motivations/${motivationId}`);
  return parseApiResponse(emptyResponseSchema, response.data);
};
