import { z } from "zod";

export const diaryResponseSchema = z
  .object({
    diaryId: z.number(),
    userId: z.number(),
    title: z.string().nullable().optional(),
    note: z.string(),
    date: z.string(),
    emoji: z.string().nullable().optional(),
    font: z.string().nullable().optional(),
    createdAt: z.string(),
  })
  .strict();

export const diaryListSchema = z.array(diaryResponseSchema);
