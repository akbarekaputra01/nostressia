import client from "./client";
import { apiResponseSchema, parseApiResponse } from "./contracts/apiResponse";
import { globalForecastPayloadSchema } from "./contracts/stressForecastSchemas";

const forecastResponseSchema = apiResponseSchema(globalForecastPayloadSchema);

/**
 * @typedef {import("./generated/api-types").GlobalForecastPayload} GlobalForecastPayload
 */

/**
 * @returns {Promise<GlobalForecastPayload>}
 */
export async function fetchGlobalForecast() {
  const response = await client.get("/stress/forecast");
  return parseApiResponse(forecastResponseSchema, response.data);
}

/**
 * @returns {Promise<GlobalForecastPayload>}
 */
export async function fetchForecastGlobal() {
  const response = await client.get("/stress/forecast");
  return parseApiResponse(forecastResponseSchema, response.data);
}
