import { DEFAULT_AVATAR, resolveAvatarUrl } from "../utils/avatar";

describe("avatar helpers", () => {
  it("returns null for empty input", () => {
    expect(resolveAvatarUrl("")).toBeNull();
    expect(resolveAvatarUrl("   ")).toBeNull();
    expect(resolveAvatarUrl(null)).toBeNull();
  });

  it("resolves default avatar assets from filenames", () => {
    expect(resolveAvatarUrl("avatar1.png")).toBe(DEFAULT_AVATAR);
    expect(resolveAvatarUrl("/assets/avatar2.png")).toContain("avatar2");
  });

  it("preserves absolute or blob/data URLs", () => {
    expect(resolveAvatarUrl("https://example.com/avatar.png")).toBe(
      "https://example.com/avatar.png",
    );
    expect(resolveAvatarUrl("data:image/png;base64,123")).toBe(
      "data:image/png;base64,123",
    );
  });

  it("builds absolute URLs for relative paths", () => {
    expect(resolveAvatarUrl("/uploads/avatar.png")).toBe(
      `${window.location.origin}/uploads/avatar.png`,
    );
    expect(resolveAvatarUrl("avatars/avatar.png")).toBe(
      `${window.location.origin}/avatars/avatar.png`,
    );
  });

  it("extracts URL values from object shapes", () => {
    expect(resolveAvatarUrl({ url: "/uploads/avatar.png" })).toBe(
      `${window.location.origin}/uploads/avatar.png`,
    );
  });
});
