import client, { unwrapResponse } from "../api/client";

export const getAnalyticsSummary = async () => {
  const response = await client.get("/analytics/summary");
  return unwrapResponse(response);
};
