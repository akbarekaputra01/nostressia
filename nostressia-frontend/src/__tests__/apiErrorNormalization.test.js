import { createApiError, normalizeApiError } from "../api/normalizeError";

describe("normalizeApiError", () => {
  it("prefers explicit message and preserves status", () => {
    const normalized = normalizeApiError({
      message: "Unauthorized",
      status: 401,
      payload: { detail: "ignored" },
    });

    expect(normalized).toMatchObject({
      message: "Unauthorized",
      status: 401,
      errors: ["ignored"],
    });
  });

  it("falls back to payload detail and keeps errors list", () => {
    const normalized = normalizeApiError({
      status: 422,
      payload: {
        detail: [{ loc: ["body", "email"], msg: "Field required" }],
      },
    });

    expect(normalized.message).toBe("Validation error");
    expect(normalized.errors).toHaveLength(1);
    expect(normalized.status).toBe(422);
  });


  it("uses detail.code when backend returns object detail without message", () => {
    const normalized = normalizeApiError({
      status: 403,
      payload: {
        detail: {
          code: "FORECAST_NOT_ELIGIBLE",
          eligibility: { streak: 2 },
        },
      },
    });

    expect(normalized.message).toBe("Forecast not eligible");
    expect(normalized.errors).toEqual([
      {
        code: "FORECAST_NOT_ELIGIBLE",
        eligibility: { streak: 2 },
      },
    ]);
  });

  it("prefers nested detail.message when available", () => {
    const normalized = normalizeApiError({
      status: 503,
      payload: {
        detail: {
          message: "Forecast model is currently unavailable",
        },
      },
    });

    expect(normalized.message).toBe("Forecast model is currently unavailable");
    expect(normalized.status).toBe(503);
  });
  it("generates a generic message when payload is unavailable", () => {
    const normalized = normalizeApiError({ status: 503, payload: null });

    expect(normalized.message).toBe("Request failed (HTTP 503).");
    expect(normalized.errors).toEqual([]);
  });
});

describe("createApiError", () => {
  it("returns Error instance with normalized metadata", () => {
    const error = createApiError({
      status: 400,
      payload: {
        message: "Bad request",
        errors: [{ field: "email", message: "Invalid" }],
      },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Bad request");
    expect(error.status).toBe(400);
    expect(error.errors).toEqual([{ field: "email", message: "Invalid" }]);
    expect(error.payload).toEqual({
      message: "Bad request",
      errors: [{ field: "email", message: "Invalid" }],
    });
  });
});
