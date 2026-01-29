import { describe, expect, it, vi } from "vitest";

import { createLogger } from "../utils/logger";

describe("logger", () => {
  it("writes formatted messages with scope prefixes", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = createLogger("TEST", { level: "debug", enabled: true });

    logger.info("Hello", { ok: true });

    expect(infoSpy).toHaveBeenCalledWith("[TEST] Hello", { ok: true });
    infoSpy.mockRestore();
  });

  it("respects the minimum log level", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logger = createLogger("TEST", { level: "warn", enabled: true });

    logger.info("Should be hidden");
    logger.warn("Visible");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("[TEST] Visible");

    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
