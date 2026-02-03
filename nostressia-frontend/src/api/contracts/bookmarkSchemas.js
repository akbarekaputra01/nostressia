import { z } from "zod";

export const motivationInBookmarkSchema = z
  .object({
    motivationId: z.number(),
    quote: z.string(),
    authorName: z.string().nullable().optional(),
  })
  .strict();

export const bookmarkResponseSchema = z
  .object({
    bookmarkId: z.number(),
    userId: z.number(),
    motivationId: z.number(),
    createdAt: z.string().nullable().optional(),
    motivation: motivationInBookmarkSchema,
  })
  .strict();

export const bookmarkListSchema = z.array(bookmarkResponseSchema);
