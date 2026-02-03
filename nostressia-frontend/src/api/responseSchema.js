import { z } from "zod";

export const ApiErrorSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    field: z.string().nullable().optional(),
  })
  .strict();

export const ApiResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.unknown().nullable(),
    errors: z.array(ApiErrorSchema).nullable(),
    meta: z.record(z.unknown()).nullable(),
  })
  .strict();

export const parseApiResponse = (payload, dataSchema) => {
  const parsed = ApiResponseSchema.safeParse(payload);
  if (!parsed.success) {
    const error = new Error("Invalid API response format");
    error.name = "ApiResponseValidationError";
    error.issues = parsed.error.issues;
    throw error;
  }

  if (dataSchema) {
    const dataParsed = dataSchema.safeParse(parsed.data.data);
    if (!dataParsed.success) {
      const error = new Error("Invalid API response data format");
      error.name = "ApiResponseDataValidationError";
      error.issues = dataParsed.error.issues;
      throw error;
    }
  }

  return parsed.data;
};
