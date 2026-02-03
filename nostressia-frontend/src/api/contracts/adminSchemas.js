import { z } from "zod";

import { diaryResponseSchema } from "./diarySchemas";
import { userResponseSchema } from "./authSchemas";

export const adminUserListSchema = z
  .object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    data: z.array(userResponseSchema),
  })
  .strict();

export const adminDiaryResponseSchema = z
  .object({
    diaryId: z.number(),
    title: z.string().nullable().optional(),
    content: z.string(),
    createdAt: z.string(),
    userId: z.number(),
    username: z.string(),
  })
  .strict();

export const adminDiaryListSchema = z
  .object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    data: z.array(adminDiaryResponseSchema),
  })
  .strict();

export const adminDiaryResponseListSchema = z.array(diaryResponseSchema);
