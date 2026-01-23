import client, { unwrapResponse } from "./client";

export async function getAllMotivations() {
  const response = await client.get("/motivations");
  return unwrapResponse(response);
}

export async function createMotivation(data) {
  const response = await client.post("/motivations", data);
  return unwrapResponse(response);
}

export async function deleteMotivation(motivationId) {
  const response = await client.delete(`/motivations/${motivationId}`);
  return unwrapResponse(response);
}
