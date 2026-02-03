import { ApiResponseSchema } from "./responseSchema";

export const parseJsonResponse = async (res) => {
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const parsed = ApiResponseSchema.safeParse(payload);
  if (!parsed.success) {
    const error = new Error("Invalid API response format");
    error.name = "ApiResponseValidationError";
    error.status = res.status;
    error.payload = payload;
    error.issues = parsed.error.issues;
    throw error;
  }

  if (!res.ok || parsed.data.success === false) {
    const message = parsed.data.message || `Request failed (HTTP ${res.status}).`;
    const error = new Error(String(message));
    error.status = res.status;
    error.payload = parsed.data;
    throw error;
  }

  return parsed.data;
};
