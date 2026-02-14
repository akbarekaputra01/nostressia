import { storage, STORAGE_KEYS } from "./storage";

const isBrowser = typeof window !== "undefined";

export const getTodayKey = () => {
  if (!isBrowser) return null;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const hasLoggedToday = () => {
  const todayKey = getTodayKey();
  if (!todayKey) return true;
  return storage.getItem(STORAGE_KEYS.TODAY_LOG) === todayKey;
};

export const resolveDisplayedStreak = (streakCount = 0) => {
  return streakCount || 0;
};
