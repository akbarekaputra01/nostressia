import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Login from "../pages/Login/Login";
import { register } from "../services/authService";

vi.mock("../services/authService", () => ({
  login: vi.fn(),
  register: vi.fn(),
  verifyOtp: vi.fn(),
  forgotPassword: vi.fn(),
  resetPasswordConfirm: vi.fn(),
  verifyResetPasswordOtp: vi.fn(),
}));

vi.mock("../theme/ThemeProvider", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    themePreference: "system",
    setPreference: vi.fn(),
  }),
}));

describe("Login signup flow", () => {
  it("flips to the signup card", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const signUpButtons = screen.getAllByRole("button", {
      name: /sign up free/i,
    });
    await user.click(signUpButtons[0]);
    expect(screen.getByText(/create account/i)).toBeInTheDocument();
  });

  it("submits the signup form and shows the OTP step", async () => {
    register.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const signUpButtons = screen.getAllByRole("button", {
      name: /sign up free/i,
    });
    await user.click(signUpButtons[0]);

    await user.type(screen.getByPlaceholderText(/john doe/i), "Example User");
    await user.type(screen.getByPlaceholderText(/your_username/i), "example");
    await user.type(
      screen.getByPlaceholderText(/name@gmail.com/i),
      "user@example.com",
    );
    await user.type(
      screen.getAllByPlaceholderText("••••••")[0],
      "Password123!",
    );
    await user.type(
      screen.getAllByPlaceholderText("••••••")[1],
      "Password123!",
    );
    await user.selectOptions(screen.getByDisplayValue(/select gender/i), "male");
    await user.type(screen.getByLabelText(/date of birth/i), "2000-01-01");

    await user.click(
      screen.getAllByRole("button", { name: /sign up free/i }).at(-1),
    );
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Example User",
        username: "example",
        email: "user@example.com",
        gender: "male",
        userDob: "2000-01-01",
      }),
    );
    expect(await screen.findByText(/verify account/i)).toBeInTheDocument();
  });

  it("shows a friendly error when signup fails", async () => {
    register.mockRejectedValueOnce(new Error("Registration failed."));
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const signUpButtons = screen.getAllByRole("button", {
      name: /sign up free/i,
    });
    await user.click(signUpButtons[0]);
    await user.type(screen.getByPlaceholderText(/john doe/i), "Example User");
    await user.type(screen.getByPlaceholderText(/your_username/i), "example");
    await user.type(
      screen.getByPlaceholderText(/name@gmail.com/i),
      "user@example.com",
    );
    await user.type(
      screen.getAllByPlaceholderText("••••••")[0],
      "Password123!",
    );
    await user.type(
      screen.getAllByPlaceholderText("••••••")[1],
      "Password123!",
    );
    await user.selectOptions(screen.getByDisplayValue(/select gender/i), "male");
    await user.type(screen.getByLabelText(/date of birth/i), "2000-01-01");

    await user.click(
      screen.getAllByRole("button", { name: /sign up free/i }).at(-1),
    );
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(await screen.findByText("Registration failed.")).toBeInTheDocument();
  });
});
