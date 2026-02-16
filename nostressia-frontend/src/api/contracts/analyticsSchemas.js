import { z } from "zod";

export const analyticsSummarySchema = z
  .object({
    stressLogsCount: z.number(),
    diaryCount: z.number(),
    streak: z.number(),
  })
  .strict();


export const weeklyReportSchema = z
  .object({
    email: z.string().email().optional(),
    report: z.unknown().optional(),
  })
  .passthrough();
