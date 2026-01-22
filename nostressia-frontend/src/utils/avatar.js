import { BASE_URL } from "../api/config";

const resolveApiOrigin = () => {
  try {
    return new URL(BASE_URL).origin;
  } catch (error) {
    return "";
  }
};

const API_ORIGIN = resolveApiOrigin();

export const resolveAvatarUrl = (avatar) => {
  if (!avatar || typeof avatar !== "string") return null;
  const trimmed = avatar.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/assets/")) return trimmed;
  if (trimmed.startsWith("/")) {
    return API_ORIGIN ? `${API_ORIGIN}${trimmed}` : trimmed;
  }
  if (trimmed.startsWith("assets/")) return `/${trimmed}`;
  return API_ORIGIN ? `${API_ORIGIN}/${trimmed}` : trimmed;
};
