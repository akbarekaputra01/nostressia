import { z } from "zod";

export const eligibilitySchema = z
  .object({
    userId: z.number(),
    eligible: z.boolean(),
    streak: z.number(),
    requiredStreak: z.number(),
    restoreUsed: z.number(),
    restoreRemaining: z.number(),
    restoreLimit: z.number(),
    missing: z.number(),
    note: z.string(),
  })
  .strict();

export const globalForecastResultSchema = z
  .object({
    userId: z.number(),
    forecastDate: z.string(),
    probability: z.number(),
    chancePercent: z.number(),
    threshold: z.number(),
    predictionBinary: z.number(),
    predictionLabel: z.string(),
    modelType: z.string(),
  })
  .strict();

export const globalForecastPayloadSchema = z
  .object({
    forecast: globalForecastResultSchema,
    eligibility: eligibilitySchema,
  })
  .strict();
