import { z } from "zod";

export const stressLevelResponseSchema = z
  .object({
    stressLevelId: z.number(),
    userId: z.number(),
    date: z.string(),
    stressLevel: z.number(),
    gpa: z.number().nullable().optional(),
    extracurricularHourPerDay: z.number().nullable().optional(),
    physicalActivityHourPerDay: z.number().nullable().optional(),
    sleepHourPerDay: z.number().nullable().optional(),
    studyHourPerDay: z.number().nullable().optional(),
    socialHourPerDay: z.number().nullable().optional(),
    emoji: z.number(),
    isRestored: z.boolean(),
    createdAt: z.string().nullable().optional(),
  })
  .strict();

export const stressLevelListSchema = z.array(stressLevelResponseSchema);

export const predictResponseSchema = z
  .object({
    result: z.string(),
    message: z.string(),
  })
  .strict();
