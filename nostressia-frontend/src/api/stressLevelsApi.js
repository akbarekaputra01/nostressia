import client from "./client";
import { apiResponseSchema, parseApiResponse } from "./contracts/apiResponse";
import { eligibilitySchema } from "./contracts/stressForecastSchemas";
import {
  stressLevelListSchema,
  stressLevelResponseSchema,
} from "./contracts/stressSchemas";

const eligibilityResponseSchema = apiResponseSchema(eligibilitySchema);
const stressLevelResponseApiSchema = apiResponseSchema(stressLevelResponseSchema);
const stressLevelListResponseSchema = apiResponseSchema(stressLevelListSchema);

/**
 * @typedef {import("./generated/api-types").Eligibility} Eligibility
 */

export async function addStressLog(data) {
  const response = await client.post("/stress-levels/", data);
  return parseApiResponse(stressLevelResponseApiSchema, response.data);
}

export async function restoreStressLog(data) {
  const response = await client.post("/stress-levels/restore", data);
  return parseApiResponse(stressLevelResponseApiSchema, response.data);
}

export async function getMyStressLogs() {
  const response = await client.get("/stress-levels/my-logs");
  return parseApiResponse(stressLevelListResponseSchema, response.data);
}

/**
 * @returns {Promise<Eligibility>}
 */
export async function getStressEligibility() {
  const response = await client.get("/stress-levels/eligibility");
  return parseApiResponse(eligibilityResponseSchema, response.data);
}

// Example usage:
// const eligibility = await getStressEligibility({ token: accessToken });
