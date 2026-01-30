import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Profile from "../pages/Profile/Profile";
import { updateProfile } from "../services/authService";

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

describe("Profile updates", () => {
  it("submits birthday and gender updates", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", {
      value: { reload: vi.fn() },
      writable: true,
    });
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    const birthdayInput = screen.getByLabelText(/birthday/i);
    const genderSelect = screen.getByLabelText(/gender/i);

    const birthdayContainer = birthdayInput.closest("div")?.parentElement;
    const genderContainer = genderSelect.closest("div")?.parentElement;
    if (!birthdayContainer || !genderContainer) {
      throw new Error("Profile fields are missing expected containers.");
    }

    await user.click(within(birthdayContainer).getByRole("button", { name: /change/i }));
    await user.click(within(genderContainer).getByRole("button", { name: /change/i }));

    await user.clear(birthdayInput);
    await user.type(birthdayInput, "1999-12-31");
    await user.selectOptions(genderSelect, "female");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        userDob: "1999-12-31",
        gender: "female",
      }),
    );
  });
});
