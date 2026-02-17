import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Profile from "../pages/Profile/Profile";
import { updateProfile } from "../services/authService";
import { readAuthToken } from "../utils/auth";

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
    useOutletContext: () => ({
      user: mockUser,
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readAuthToken).mockReturnValue("token");
});

describe("Profile updates", () => {
  it("submits birthday and gender updates", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    Object.defineProperty(window, "location", {
      value: { reload: vi.fn() },
      writable: true,
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/birthday/i), { target: { value: "1999-12-31" } });
    await user.selectOptions(screen.getByLabelText(/gender/i), "female");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          userDob: "1999-12-31",
          gender: "female",
        }),
      );
    });
  });

  it("does not submit when birthday is in the future", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/birthday/i), { target: { value: futureDate } });
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateProfile).not.toHaveBeenCalled();
    });
  });

  it("does not submit when gender is invalid", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    const genderSelect = screen.getByLabelText(/gender/i);
    genderSelect.append(new Option("Invalid", "invalid"));
    fireEvent.change(genderSelect, { target: { value: "invalid" } });
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateProfile).not.toHaveBeenCalled();
    });
  });

  it("does not submit when auth token is missing", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.mocked(readAuthToken).mockReturnValue(null);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateProfile).not.toHaveBeenCalled();
    });
  });
});
