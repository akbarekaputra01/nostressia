import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Profile from "../pages/Profile/Profile";
import { sendWeeklyReport } from "../services/analyticsService";

vi.mock("../services/authService", () => ({
  changePassword: vi.fn().mockResolvedValue({}),
  updateProfile: vi.fn().mockResolvedValue({}),
  verifyCurrentPassword: vi.fn().mockResolvedValue({}),
  getProfile: vi.fn().mockResolvedValue({}),
}));

vi.mock("../services/bookmarkService", () => ({
  deleteBookmark: vi.fn(),
  getMyBookmarks: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/stressService", () => ({
  getMyStressLogs: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/analyticsService", () => ({
  sendWeeklyReport: vi.fn().mockResolvedValue({ email: "user@example.com" }),
  getAnalyticsSummary: vi.fn().mockResolvedValue({ streak: 0, stressLogsCount: 0, diaryCount: 0 }),
}));

vi.mock("../utils/notificationService", () => ({
  getSavedNotificationSettings: vi.fn().mockReturnValue(null),
  saveNotificationSettings: vi.fn(),
  subscribeDailyReminder: vi.fn().mockResolvedValue({ ok: true }),
  unsubscribeDailyReminder: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("../utils/auth", () => ({
  AUTH_SCOPE: { USER: "user", ADMIN: "admin" },
  readAuthToken: vi.fn().mockReturnValue("token"),
  clearAuthToken: vi.fn(),
}));

vi.mock("../theme/ThemeProvider", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    themePreference: "system",
    setPreference: vi.fn(),
  }),
}));

const mockUser = {
  username: "example",
  name: "Example User",
  email: "user@example.com",
  avatar: "",
  userDob: "2000-01-01",
  gender: "male",
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useOutletContext: () => ({ user: mockUser }),
  };
});

describe("Profile weekly report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends weekly report only when Send Report button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("button", { name: /^notifications$/i }));

    expect(sendWeeklyReport).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /send report/i }));

    expect(sendWeeklyReport).toHaveBeenCalledTimes(1);
  }, 10000);

  it("does not send weekly report when Save Preferences button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("button", { name: /^notifications$/i }));

    await user.click(screen.getByRole("button", { name: /save preferences/i }));

    expect(sendWeeklyReport).not.toHaveBeenCalled();
  });
});
