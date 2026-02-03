import { z } from "zod";

export const emailResponseSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export const userResponseSchema = z
  .object({
    userId: z.number(),
    name: z.string(),
    username: z.string(),
    email: z.string().email(),
    gender: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    userDob: z.string().nullable().optional(),
    streak: z.number(),
    diaryCount: z.number(),
    isVerified: z.boolean(),
  })
  .strict();

export const userTokenResponseSchema = z
  .object({
    accessToken: z.string(),
    tokenType: z.string(),
    user: userResponseSchema,
  })
  .strict();

export const adminResponseSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    email: z.string().email(),
  })
  .strict();

export const adminLoginResponseSchema = z
  .object({
    accessToken: z.string(),
    tokenType: z.string(),
    admin: adminResponseSchema,
  })
  .strict();
