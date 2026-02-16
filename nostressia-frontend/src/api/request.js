import { createApiError } from "./normalizeError";

export const parseJsonResponse = async (res) => {
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw createApiError({
      message: payload?.message,
      status: res.status,
      payload,
    });
  }

  return payload;
};
