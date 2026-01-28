import MockAdapter from "axios-mock-adapter";

import client from "../api/client";
import {
  persistAdminProfile,
  persistAdminToken,
  readAdminProfile,
  readAdminToken,
} from "../utils/auth";

describe("api client auth handling", () => {
  const originalLocation = window.location;

  beforeEach(() => {
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
  });

  it("clears the admin session after a 401 response", async () => {
    const mock = new MockAdapter(client);
    mock.onGet("/admin/users").reply(401, { message: "Unauthorized" });

    persistAdminToken("expired-token");
    persistAdminProfile({ id: 1, name: "Admin" });

    await expect(client.get("/admin/users", { auth: "admin" })).rejects.toThrow();

    expect(readAdminToken()).toBeNull();
    expect(readAdminProfile()).toBeNull();
    expect(window.location.assign).toHaveBeenCalledWith("/admin/login");

    mock.restore();
  });
});
