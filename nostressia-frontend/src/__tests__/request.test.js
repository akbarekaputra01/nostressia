import { parseJsonResponse } from "../api/request";

describe("parseJsonResponse", () => {
  it("returns parsed payload on success", async () => {
    const response = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ ok: true }),
    };

    await expect(parseJsonResponse(response)).resolves.toEqual({ ok: true });
  });

  it("throws with details when the response fails", async () => {
    const response = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ detail: "Bad request." }),
    };

    await expect(parseJsonResponse(response)).rejects.toMatchObject({
      message: "Bad request.",
      status: 400,
      payload: { detail: "Bad request." },
    });
  });

  it("handles invalid JSON bodies gracefully", async () => {
    const response = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
    };

    await expect(parseJsonResponse(response)).rejects.toMatchObject({
      message: "Request failed (HTTP 500).",
      status: 500,
      payload: null,
    });
  });
});
