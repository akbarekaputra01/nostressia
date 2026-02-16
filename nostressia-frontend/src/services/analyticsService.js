import client from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import { analyticsSummarySchema, weeklyReportSchema } from "../api/contracts/analyticsSchemas";

const analyticsSummaryResponseSchema = apiResponseSchema(analyticsSummarySchema);
const weeklyReportResponseSchema = apiResponseSchema(weeklyReportSchema);

export const getAnalyticsSummary = async () => {
  const response = await client.get("/analytics/summary");
  return parseApiResponse(analyticsSummaryResponseSchema, response.data);
};


export const sendWeeklyReport = async () => {
  const response = await client.post("/analytics/weekly-report");
  return parseApiResponse(weeklyReportResponseSchema, response.data);
};
