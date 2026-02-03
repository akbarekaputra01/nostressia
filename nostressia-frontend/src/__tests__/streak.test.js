import { getTodayKey, hasLoggedToday, resolveDisplayedStreak } from "../utils/streak";
import { storage, STORAGE_KEYS } from "../utils/storage";

describe("streak helpers", () => {
  it("returns today's key based on the current date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-16T08:00:00.000Z"));

    expect(getTodayKey()).toBe("2024-05-16");
  });

  it("tracks whether the user logged today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-16T08:00:00.000Z"));

    storage.setItem(STORAGE_KEYS.TODAY_LOG, "2024-05-16");
    expect(hasLoggedToday()).toBe(true);

    storage.setItem(STORAGE_KEYS.TODAY_LOG, "2024-05-15");
    expect(hasLoggedToday()).toBe(false);
  });

  it("zeroes out the streak when today is missing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-16T08:00:00.000Z"));

    storage.removeItem(STORAGE_KEYS.TODAY_LOG);
    expect(resolveDisplayedStreak(3)).toBe(0);
  });

  it("returns the streak count when the log exists", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-16T08:00:00.000Z"));

    storage.setItem(STORAGE_KEYS.TODAY_LOG, "2024-05-16");
    expect(resolveDisplayedStreak(4)).toBe(4);
  });
});
