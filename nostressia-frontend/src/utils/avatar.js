import { apiOrigin } from "../api/client";

export const resolveAvatarUrl = (avatar) => {
  if (!avatar || typeof avatar !== "string") return null;
  const trimmed = avatar.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/assets/")) return trimmed;
  if (trimmed.startsWith("/")) {
    return apiOrigin ? `${apiOrigin}${trimmed}` : trimmed;
  }
  if (trimmed.startsWith("assets/")) return `/${trimmed}`;
  return apiOrigin ? `${apiOrigin}/${trimmed}` : trimmed;
};
