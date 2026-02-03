import { describe, expect, it } from "vitest";

import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import { globalForecastPayloadSchema } from "../api/contracts/stressForecastSchemas";

const forecastResponseSchema = apiResponseSchema(globalForecastPayloadSchema);

describe("Stress forecast contract", () => {
  it("parses a valid forecast response", () => {
    const payload = {
      success: true,
      message: "Forecast fetched",
      data: {
        forecast: {
          userId: 1,
          forecastDate: "2024-01-01",
          probability: 0.6,
          chancePercent: 60,
          threshold: 0.5,
          predictionBinary: 1,
          predictionLabel: "High",
          modelType: "global_markov",
        },
        eligibility: {
          userId: 1,
          eligible: true,
          streak: 7,
          requiredStreak: 7,
          restoreUsed: 0,
          restoreRemaining: 3,
          restoreLimit: 3,
          missing: 0,
          note: "Eligible",
        },
      },
      errors: null,
      meta: null,
    };

    const data = parseApiResponse(forecastResponseSchema, payload);
    expect(data.forecast.predictionLabel).toBe("High");
    expect(data.eligibility.eligible).toBe(true);
  });

  it("rejects a mismatched forecast payload", () => {
    const payload = {
      success: true,
      message: "Forecast fetched",
      data: {
        forecast: {
          userId: 1,
          forecastDate: "2024-01-01",
        },
        eligibility: {
          userId: 1,
          eligible: true,
        },
      },
      errors: null,
      meta: null,
    };

    expect(() => parseApiResponse(forecastResponseSchema, payload)).toThrow();
  });
});
