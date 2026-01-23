import client, { unwrapResponse } from "../api/client";

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

export const getStressEligibility = async () => {
  const response = await client.get("/stress-levels/eligibility");
  return unwrapResponse(response);
};

export const getGlobalForecast = async () => {
  const response = await client.get("/stress/global-forecast");
  return unwrapResponse(response);
};

export const predictCurrentStress = async (payload) => {
  const response = await client.post("/stress/current", payload);
  return unwrapResponse(response);
};
