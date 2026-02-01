import { storage, STORAGE_KEYS } from "./storage";

const isBrowser = typeof window !== "undefined";

export const getTodayKey = () => {
  if (!isBrowser) return null;
  return new Date().toISOString().slice(0, 10);
};

export const hasLoggedToday = () => {
  const todayKey = getTodayKey();
  if (!todayKey) return true;
  return storage.getItem(STORAGE_KEYS.TODAY_LOG) === todayKey;
};

export const resolveDisplayedStreak = (streakCount = 0) => {
  if (!hasLoggedToday()) return 0;
  return streakCount || 0;
};
