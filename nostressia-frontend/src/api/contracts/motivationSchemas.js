import { z } from "zod";

export const motivationResponseSchema = z
  .object({
    motivationId: z.number(),
    quote: z.string(),
    uploaderId: z.number().nullable().optional(),
    authorName: z.string().nullable().optional(),
  })
  .strict();

export const motivationListSchema = z.array(motivationResponseSchema);
