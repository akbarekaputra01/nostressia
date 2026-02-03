import client from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import { analyticsSummarySchema } from "../api/contracts/analyticsSchemas";

const analyticsSummaryResponseSchema = apiResponseSchema(analyticsSummarySchema);

export const getAnalyticsSummary = async () => {
  const response = await client.get("/analytics/summary");
  return parseApiResponse(analyticsSummaryResponseSchema, response.data);
};
