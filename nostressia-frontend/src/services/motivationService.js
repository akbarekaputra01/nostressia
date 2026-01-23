import client, { unwrapResponse } from "../api/client";

export const getMotivations = async () => {
  const response = await client.get("/motivations");
  return unwrapResponse(response);
};

export const createMotivation = async (payload) => {
  const response = await client.post("/motivations", payload);
  return unwrapResponse(response);
};

export const deleteMotivation = async (motivationId) => {
  const response = await client.delete(`/motivations/${motivationId}`);
  return unwrapResponse(response);
};
