import { z } from "zod";

export const tipsCategorySchema = z
  .object({
    tipCategoryId: z.number(),
    categoryName: z.string(),
  })
  .strict();

export const tipsCategoryListSchema = z.array(tipsCategorySchema);

export const tipsResponseSchema = z
  .object({
    tipId: z.number(),
    detail: z.string(),
    tipCategoryId: z.number(),
    uploaderId: z.number(),
  })
  .strict();

export const tipsListSchema = z.array(tipsResponseSchema);
