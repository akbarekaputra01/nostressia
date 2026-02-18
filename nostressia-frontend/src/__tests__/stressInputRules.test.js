import { describe, expect, it } from "vitest";

import {
  calculateDailyActivityHours,
  isWithinDailyActivityLimit,
  MAX_DAILY_ACTIVITY_HOURS,
} from "../pages/Dashboard/stressInputRules";

describe("stressInputRules", () => {
  it("calculates total hours across dashboard activity fields", () => {
    const total = calculateDailyActivityHours({
      studyHours: 4,
      extracurricularHours: 2,
      sleepHours: 7,
      socialHours: 3,
      physicalHours: 2,
    });

    expect(total).toBe(18);
  });

  it("treats empty or invalid values as zero", () => {
    const total = calculateDailyActivityHours({
      studyHours: "",
      extracurricularHours: null,
      sleepHours: undefined,
      socialHours: "abc",
      physicalHours: 2,
    });

    expect(total).toBe(2);
  });

  it("enforces maximum daily activity limit", () => {
    expect(isWithinDailyActivityLimit(24)).toBe(true);
    expect(isWithinDailyActivityLimit(MAX_DAILY_ACTIVITY_HOURS + 1)).toBe(false);
  });
});
