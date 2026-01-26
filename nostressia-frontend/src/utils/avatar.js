import { apiOrigin } from "../api/client";
import avatar1 from "../assets/images/avatar1.png";
import avatar2 from "../assets/images/avatar2.png";
import avatar3 from "../assets/images/avatar3.png";
import avatar4 from "../assets/images/avatar4.png";
import avatar5 from "../assets/images/avatar5.png";

const DEFAULT_AVATAR_MAP = {
  "avatar1.png": avatar1,
  "avatar2.png": avatar2,
  "avatar3.png": avatar3,
  "avatar4.png": avatar4,
  "avatar5.png": avatar5,
};

export const DEFAULT_AVATAR = avatar1;

const resolveDefaultAvatar = (value) => {
  if (!value || typeof value !== "string") return null;
  const sanitized = value.trim().split("?")[0].split("#")[0];
  const filename = sanitized.split("/").pop()?.toLowerCase();
  if (filename && DEFAULT_AVATAR_MAP[filename]) {
    return DEFAULT_AVATAR_MAP[filename];
  }
  return null;
};

export const resolveAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (typeof avatar === "object") {
    const candidate =
      avatar.url ||
      avatar.profileImageUrl ||
      avatar.avatarUrl ||
      avatar.src;
    if (typeof candidate === "string") {
      return resolveAvatarUrl(candidate);
    }
    return null;
  }
  if (typeof avatar !== "string") return null;
  const trimmed = avatar.trim();
  if (!trimmed) return null;
  const defaultAvatar = resolveDefaultAvatar(trimmed);
  if (defaultAvatar) return defaultAvatar;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/assets/")) return trimmed;
  if (trimmed.startsWith("/")) {
    return apiOrigin ? `${apiOrigin}${trimmed}` : trimmed;
  }
  if (trimmed.startsWith("assets/")) return `/${trimmed}`;
  return apiOrigin ? `${apiOrigin}/${trimmed}` : trimmed;
};
