import { z } from "zod";

export const apiResponseSchema = (dataSchema) =>
  z
    .object({
      success: z.boolean(),
      message: z.string(),
      data: dataSchema.nullable(),
      errors: z.array(z.unknown()).nullable(),
      meta: z.record(z.unknown()).nullable(),
    })
    .strict();

export const parseApiResponse = (schema, payload) => {
  const parsed = schema.parse(payload);
  if (!parsed.success) {
    const error = new Error(parsed.message || "Request failed");
    error.payload = parsed;
    throw error;
  }
  return parsed.data;
};
