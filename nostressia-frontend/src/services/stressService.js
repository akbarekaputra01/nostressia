import client from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import {
  eligibilitySchema,
  globalForecastPayloadSchema,
} from "../api/contracts/stressForecastSchemas";
import {
  predictResponseSchema,
  stressLevelListSchema,
  stressLevelResponseSchema,
} from "../api/contracts/stressSchemas";

const eligibilityResponseSchema = apiResponseSchema(eligibilitySchema);
const forecastResponseSchema = apiResponseSchema(globalForecastPayloadSchema);
const stressLevelResponseApiSchema = apiResponseSchema(stressLevelResponseSchema);
const stressLevelListResponseSchema = apiResponseSchema(stressLevelListSchema);
const predictResponseApiSchema = apiResponseSchema(predictResponseSchema);

/**
 * @typedef {import("../api/generated/api-types").Eligibility} Eligibility
 * @typedef {import("../api/generated/api-types").GlobalForecastPayload} GlobalForecastPayload
 */

export const addStressLog = async (payload) => {
  const response = await client.post("/stress-levels/", payload);
  return parseApiResponse(stressLevelResponseApiSchema, response.data);
};

export const restoreStressLog = async (payload) => {
  const response = await client.post("/stress-levels/restore", payload);
  return parseApiResponse(stressLevelResponseApiSchema, response.data);
};

export const updateStressLog = async (stressLevelId, payload) => {
  const response = await client.put(`/stress-levels/${stressLevelId}`, payload);
  return parseApiResponse(stressLevelResponseApiSchema, response.data);
};

export const getMyStressLogs = async ({
  startDate,
  endDate,
  pageSize = 200,
  fetchAll = true,
  page = 1,
} = {}) => {
  const allLogs = [];
  let currentPage = page;

  while (true) {
    const response = await client.get("/stress-levels/my-logs", {
      params: {
        page: currentPage,
        limit: pageSize,
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      },
    });

    const currentPageLogs = parseApiResponse(stressLevelListResponseSchema, response.data);
    allLogs.push(...currentPageLogs);

    if (!fetchAll || currentPageLogs.length < pageSize) {
      break;
    }

    currentPage += 1;
  }

  return allLogs;
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
  return parseApiResponse(predictResponseApiSchema, response.data);
};
