import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Profile from "../pages/Profile/Profile";
import {
  saveNotificationSettings,
  subscribeDailyReminder,
  unsubscribeDailyReminder,
} from "../utils/notificationService";

vi.mock("../services/authService", () => ({
  changePassword: vi.fn().mockResolvedValue({}),
  updateProfile: vi.fn().mockResolvedValue({}),
  verifyCurrentPassword: vi.fn().mockResolvedValue({}),
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
  subscribeDailyReminder: vi.fn().mockResolvedValue({ ok: true, message: "ok" }),
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

const openNotificationPreferences = async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: /settings/i }));
  await user.click(screen.getByRole("button", { name: /^notifications$/i }));

  return user;
};

describe("Profile notification permission flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps reminders disabled and avoids subscribe when browser permission is denied", async () => {
    vi.stubGlobal("Notification", {
      permission: "denied",
      requestPermission: vi.fn().mockResolvedValue("denied"),
    });

    const user = await openNotificationPreferences();

    await user.click(screen.getByRole("button", { name: /save preferences/i }));

    expect(await screen.findByText(/allow notifications\?/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^allow$/i }));

    expect(await screen.findAllByText(/notifications are blocked/i)).toHaveLength(2);
    expect(subscribeDailyReminder).not.toHaveBeenCalled();
  });

  it("disables reminder and unsubscribes when user dismisses permission prompt", async () => {
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: vi.fn().mockResolvedValue("default"),
    });

    const user = await openNotificationPreferences();

    await user.click(screen.getByRole("button", { name: /save preferences/i }));
    await user.click(screen.getByRole("button", { name: /not now/i }));

    expect(unsubscribeDailyReminder).toHaveBeenCalledTimes(1);
    expect(saveNotificationSettings).toHaveBeenCalledWith(
      expect.objectContaining({ dailyReminder: false }),
    );
  });
});
