import client, { unwrapResponse } from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import {
  eligibilitySchema,
  globalForecastPayloadSchema,
} from "../api/contracts/stressForecastSchemas";

const eligibilityResponseSchema = apiResponseSchema(eligibilitySchema);
const forecastResponseSchema = apiResponseSchema(globalForecastPayloadSchema);

/**
 * @typedef {import("../api/generated/api-types").Eligibility} Eligibility
 * @typedef {import("../api/generated/api-types").GlobalForecastPayload} GlobalForecastPayload
 */

export const addStressLog = async (payload) => {
  const response = await client.post("/stress-levels/", payload);
  return unwrapResponse(response);
};

export const restoreStressLog = async (payload) => {
  const response = await client.post("/stress-levels/restore", payload);
  return unwrapResponse(response);
};

export const getMyStressLogs = async () => {
  const response = await client.get("/stress-levels/my-logs");
  return unwrapResponse(response);
};

/**
 * @returns {Promise<Eligibility>}
 */
export const getStressEligibility = async () => {
  const response = await client.get("/stress-levels/eligibility");
  return parseApiResponse(eligibilityResponseSchema, response.data);
};

/**
 * @returns {Promise<GlobalForecastPayload>}
 */
export const getGlobalForecast = async () => {
  const response = await client.get("/stress/forecast");
  return parseApiResponse(forecastResponseSchema, response.data);
};

export const predictCurrentStress = async (payload) => {
  const response = await client.post("/stress/current", payload);
  return unwrapResponse(response);
};
