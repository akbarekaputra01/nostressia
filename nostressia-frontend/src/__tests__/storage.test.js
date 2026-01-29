import { resolveLegacyJson, resolveLegacyValue, storage } from "../utils/storage";

describe("storage helpers", () => {
  it("reads and removes simple values", () => {
    storage.setItem("nostressia_test_key", "value");
    expect(storage.getItem("nostressia_test_key")).toBe("value");
    storage.removeItem("nostressia_test_key");
    expect(storage.getItem("nostressia_test_key")).toBeNull();
  });

  it("migrates legacy string values", () => {
    localStorage.setItem("legacy_key", "legacy");
    const value = resolveLegacyValue({
      key: "nostressia_new_key",
      legacyKeys: ["legacy_key"],
    });

    expect(value).toBe("legacy");
    expect(localStorage.getItem("nostressia_new_key")).toBe("legacy");
    expect(localStorage.getItem("legacy_key")).toBeNull();
  });

  it("migrates legacy JSON values", () => {
    localStorage.setItem("legacy_json", JSON.stringify({ id: 1 }));
    const value = resolveLegacyJson({
      key: "nostressia_json_key",
      legacyKeys: ["legacy_json"],
    });

    expect(value).toEqual({ id: 1 });
    expect(localStorage.getItem("nostressia_json_key")).toBe(JSON.stringify({ id: 1 }));
    expect(localStorage.getItem("legacy_json")).toBeNull();
  });
});
