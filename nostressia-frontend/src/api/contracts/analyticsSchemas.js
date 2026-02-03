import { z } from "zod";

export const analyticsSummarySchema = z
  .object({
    stressLogsCount: z.number(),
    diaryCount: z.number(),
    streak: z.number(),
  })
  .strict();
