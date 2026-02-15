import { z } from "zod";

export const notificationStatusSchema = z.object({
  dailyReminder: z.boolean().optional(),
  reminderTime: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
});

export const notificationTestSchema = z
  .object({
    sent: z.boolean(),
  })
  .strict();
