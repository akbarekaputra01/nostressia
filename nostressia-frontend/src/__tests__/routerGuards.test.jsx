import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  AdminProtectedRoute,
  AdminPublicRoute,
} from "../router";
import { persistAdminProfile, persistAdminToken, clearAdminSession } from "../utils/auth";

describe("admin route guards", () => {
  afterEach(() => {
    clearAdminSession();
  });

  it("redirects unauthenticated admins to /admin/login", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<div>Admin Home</div>} />
          </Route>
          <Route path="/admin/login" element={<div>Admin Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Login")).toBeInTheDocument();
  });

  it("allows authenticated admins to access protected routes", () => {
    persistAdminToken("token");
    persistAdminProfile({ id: 1, name: "Admin" });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<div>Admin Home</div>} />
          </Route>
          <Route path="/admin/login" element={<div>Admin Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Home")).toBeInTheDocument();
  });

  it("redirects authenticated admins away from public admin routes", () => {
    persistAdminToken("token");
    persistAdminProfile({ id: 1, name: "Admin" });

    render(
      <MemoryRouter initialEntries={["/admin/login"]}>
        <Routes>
          <Route element={<AdminPublicRoute />}>
            <Route path="/admin/login" element={<div>Admin Login</div>} />
          </Route>
          <Route path="/admin" element={<div>Admin Home</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Home")).toBeInTheDocument();
  });
});
