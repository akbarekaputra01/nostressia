import client, { unwrapResponse } from "../api/client";

export const getMyBookmarks = async () => {
  const response = await client.get("/bookmarks/me");
  return unwrapResponse(response);
};

export const addBookmark = async (motivationId) => {
  const response = await client.post(`/bookmarks/${motivationId}`);
  return unwrapResponse(response);
};

export const deleteBookmark = async (motivationId) => {
  const response = await client.delete(`/bookmarks/${motivationId}`);
  return unwrapResponse(response);
};
