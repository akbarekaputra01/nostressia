import MockAdapter from "axios-mock-adapter";

import { adminClient } from "../api/client";
import {
  persistAdminProfile,
  persistAdminToken,
  readAdminProfile,
  readAdminToken,
} from "../utils/auth";

describe("api client auth handling", () => {
  const originalLocation = window.location;
  const originalEnv = process.env.VITE_DISABLE_AUTH;

  beforeEach(() => {
    process.env.VITE_DISABLE_AUTH = "false";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { pathname: "/admin", assign: vi.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
      writable: true,
    });
    process.env.VITE_DISABLE_AUTH = originalEnv;
  });

  it("clears the admin session after a 401 response", async () => {
    const mock = new MockAdapter(adminClient);
    mock.onGet("/admin/users").reply(401, { message: "Unauthorized" });

    persistAdminToken("expired-token");
    persistAdminProfile({ id: 1, name: "Admin" });

    await expect(
      adminClient.get("/admin/users", { authScope: "admin" }),
    ).rejects.toThrow();

    expect(readAdminToken()).toBeNull();
    expect(readAdminProfile()).toBeNull();
    expect(window.location.assign).toHaveBeenCalledWith("/admin/login");

    mock.restore();
  });
});
