import client from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import { bookmarkListSchema } from "../api/contracts/bookmarkSchemas";
import { z } from "zod";

const bookmarkListResponseSchema = apiResponseSchema(bookmarkListSchema);
const emptyResponseSchema = apiResponseSchema(z.null());

export const getMyBookmarks = async () => {
  const response = await client.get("/bookmarks/me");
  return parseApiResponse(bookmarkListResponseSchema, response.data);
};

export const addBookmark = async (motivationId) => {
  const response = await client.post(`/bookmarks/${motivationId}`);
  return parseApiResponse(emptyResponseSchema, response.data);
};

export const deleteBookmark = async (motivationId) => {
  const response = await client.delete(`/bookmarks/${motivationId}`);
  return parseApiResponse(emptyResponseSchema, response.data);
};
