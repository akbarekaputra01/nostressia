import client, { unwrapResponse } from "./client";

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

export async function getStressEligibility() {
  const response = await client.get("/stress-levels/eligibility");
  return unwrapResponse(response);
}

// Example usage:
// const eligibility = await getStressEligibility({ token: accessToken });
