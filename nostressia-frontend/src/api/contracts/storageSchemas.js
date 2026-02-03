import { z } from "zod";

export const storageUploadSasSchema = z
  .object({
    uploadUrl: z.string(),
    blobUrl: z.string(),
    blobName: z.string(),
    expiresInMinutes: z.number(),
  })
  .strict();
