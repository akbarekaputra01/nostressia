import client, { unwrapResponse } from "./client";
import { apiResponseSchema, parseApiResponse } from "./contracts/apiResponse";
import { eligibilitySchema } from "./contracts/stressForecastSchemas";

const eligibilityResponseSchema = apiResponseSchema(eligibilitySchema);

/**
 * @typedef {import("./generated/api-types").Eligibility} Eligibility
 */

export async function addStressLog(data) {
  const response = await client.post("/stress-levels/", data);
  return unwrapResponse(response);
}

export async function restoreStressLog(data) {
  const response = await client.post("/stress-levels/restore", data);
  return unwrapResponse(response);
}

export async function getMyStressLogs() {
  const response = await client.get("/stress-levels/my-logs");
  return unwrapResponse(response);
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
