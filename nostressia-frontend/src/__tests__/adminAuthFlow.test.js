import MockAdapter from "axios-mock-adapter";

import client, { adminClient } from "../api/client";
import { adminLogin } from "../services/authService";
import { getAdminUsers } from "../services/adminService";
import { persistAdminToken } from "../utils/auth";

describe("admin auth flow", () => {
  it("stores the admin token and sends it with admin requests", async () => {
    const userMock = new MockAdapter(client);
    const adminMock = new MockAdapter(adminClient);

    userMock.onPost("/auth/admin/login").reply(200, {
      success: true,
      message: "Admin login successful",
      data: {
        accessToken: "admin-token",
        tokenType: "bearer",
        admin: { id: 1, name: "Admin", username: "admin", email: "admin@example.com" },
      },
      errors: null,
      meta: null,
    });

    adminMock.onGet("/admin/users/").reply((config) => {
      const authHeader = config.headers?.Authorization || config.headers?.authorization;
      expect(authHeader).toBe("Bearer admin-token");
      return [
        200,
        {
          success: true,
          message: "Users fetched",
          data: { total: 0, page: 1, limit: 10, data: [] },
          errors: null,
          meta: null,
        },
      ];
    });

    const loginData = await adminLogin({ username: "admin", password: "admin123" });
    persistAdminToken(loginData.accessToken);

    const result = await getAdminUsers({ limit: 10 });
    expect(result.total).toBe(0);

    userMock.restore();
    adminMock.restore();
  });
});
