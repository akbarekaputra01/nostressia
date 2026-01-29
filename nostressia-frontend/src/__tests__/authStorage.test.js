import {
  clearAdminSession,
  clearAuthToken,
  hasAdminSession,
  persistAdminProfile,
  persistAdminToken,
  persistAuthToken,
  readAdminProfile,
  readAdminToken,
  readAuthToken,
} from "../utils/auth";

describe("auth storage helpers", () => {
  it("persists and reads the user access token", () => {
    persistAuthToken("access-token");
    expect(readAuthToken()).toBe("access-token");
    clearAuthToken();
    expect(readAuthToken()).toBeNull();
  });

  it("migrates legacy user token keys", () => {
    localStorage.setItem("accessToken", "legacy-token");
    expect(readAuthToken()).toBe("legacy-token");
    expect(localStorage.getItem("nostressia_accessToken")).toBe("legacy-token");
  });

  it("persists and reads the admin session", () => {
    persistAdminToken("admin-token");
    persistAdminProfile({ id: 1, name: "Admin" });
    expect(readAdminToken()).toBe("admin-token");
    expect(readAdminProfile()).toEqual({ id: 1, name: "Admin" });
    expect(hasAdminSession()).toBe(true);
    clearAdminSession();
    expect(readAdminToken()).toBeNull();
    expect(readAdminProfile()).toBeNull();
  });

  it("does not report an admin session without a profile", () => {
    persistAdminToken("admin-token");
    expect(hasAdminSession()).toBe(false);
  });
});
