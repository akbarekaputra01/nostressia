import { describe, expect, it } from "vitest";

import { ApiResponseSchema } from "../api/responseSchema";

describe("ApiResponseSchema", () => {
  it("accepts a valid response wrapper", () => {
    const result = ApiResponseSchema.safeParse({
      success: true,
      message: "OK",
      data: { ok: true },
      errors: null,
      meta: null,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a response missing required fields", () => {
    const result = ApiResponseSchema.safeParse({
      success: true,
      message: "OK",
    });

    expect(result.success).toBe(false);
  });
});
