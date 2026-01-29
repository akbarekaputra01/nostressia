import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Dashboard from "../pages/Dashboard/Dashboard";

vi.mock("../services/stressService", () => ({
  addStressLog: vi.fn().mockResolvedValue({ stressLevelId: 1 }),
  getGlobalForecast: vi.fn().mockResolvedValue({}),
  getMyStressLogs: vi.fn().mockResolvedValue([]),
  getStressEligibility: vi.fn().mockResolvedValue({
    eligible: true,
    restoreUsed: 0,
    restoreLimit: 3,
  }),
  predictCurrentStress: vi.fn().mockResolvedValue({
    result: "Low",
    message: "Test",
  }),
  restoreStressLog: vi.fn().mockResolvedValue({ stressLevelId: 1 }),
}));

vi.mock("../services/motivationService", () => ({
  getMotivations: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/tipsService", () => ({
  getTipCategories: vi.fn().mockResolvedValue([]),
  getTipsByCategory: vi.fn().mockResolvedValue([]),
}));

vi.mock("../utils/auth", () => ({
  AUTH_SCOPE: { USER: "user", ADMIN: "admin" },
  readAuthToken: vi.fn().mockReturnValue("token"),
  clearAuthToken: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useOutletContext: () => ({ user: { name: "Example" } }),
  };
});

describe("Dashboard scroll behavior", () => {
  it("keeps the stress form scrollable", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    const saveButton = await screen.findByText(/save data/i);
    const form = saveButton.closest("form");
    const scrollArea = form?.querySelector(".overflow-y-auto");
    expect(scrollArea).toBeInTheDocument();
  });
});
