import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Profile from "../pages/Profile/Profile";
import { verifyCurrentPassword } from "../services/authService";

vi.mock("../services/authService", () => ({
  changePassword: vi.fn().mockResolvedValue({}),
  updateProfile: vi.fn().mockResolvedValue({}),
  verifyCurrentPassword: vi.fn(),
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

describe("Profile password flow", () => {
  it("keeps new password fields hidden until current password is verified", async () => {
    verifyCurrentPassword.mockRejectedValueOnce(
      new Error("Current password is incorrect."),
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("button", { name: /change password/i }));

    await user.type(
      screen.getByLabelText(/current password/i),
      "wrong-password",
    );
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(verifyCurrentPassword).toHaveBeenCalled();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  it("reveals new password fields after current password verification", async () => {
    verifyCurrentPassword.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("button", { name: /change password/i }));

    await user.type(
      screen.getByLabelText(/current password/i),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(verifyCurrentPassword).toHaveBeenCalled();
    expect(await screen.findByLabelText(/^new password$/i)).toBeInTheDocument();
  });
});
