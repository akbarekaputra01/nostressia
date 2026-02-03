import client from "./client";
import { apiResponseSchema, parseApiResponse } from "./contracts/apiResponse";
import {
  motivationListSchema,
  motivationResponseSchema,
} from "./contracts/motivationSchemas";
import { z } from "zod";

const motivationListResponseSchema = apiResponseSchema(motivationListSchema);
const motivationResponseApiSchema = apiResponseSchema(motivationResponseSchema);
const emptyResponseSchema = apiResponseSchema(z.null());

export async function getAllMotivations() {
  const response = await client.get("/motivations/");
  return parseApiResponse(motivationListResponseSchema, response.data);
}

export async function createMotivation(data) {
  const response = await client.post("/motivations/", data);
  return parseApiResponse(motivationResponseApiSchema, response.data);
}

export async function deleteMotivation(motivationId) {
  const response = await client.delete(`/motivations/${motivationId}`);
  return parseApiResponse(emptyResponseSchema, response.data);
}
