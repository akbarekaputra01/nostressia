import client, { unwrapResponse } from "./client";

export async function fetchGlobalForecast() {
  const response = await client.get("/stress/global-forecast");
  return unwrapResponse(response);
}

export async function fetchForecastGlobal() {
  const response = await client.get("/stress/global-forecast");
  return unwrapResponse(response);
}
