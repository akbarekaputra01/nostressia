import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeProvider, useTheme } from "../theme/ThemeProvider";
import { STORAGE_KEYS } from "../utils/storage";

const ThemeConsumer = () => {
  const { preference, resolvedTheme, setPreference } = useTheme();

  return (
    <div>
      <span data-testid="preference">{preference}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setPreference("dark")}>
        Dark mode
      </button>
    </div>
  );
};

describe("ThemeProvider", () => {
  it("requires the provider when consuming the hook", () => {
    const Consumer = () => {
      useTheme();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow("useTheme must be used within a ThemeProvider");
  });

  it("stores the theme preference and updates the DOM", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");

    await user.click(screen.getByRole("button", { name: /dark mode/i }));

    expect(screen.getByTestId("preference")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)).toBe("dark");

    const root = document.documentElement;
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.dataset.theme).toBe("dark");
    expect(root.dataset.themePreference).toBe("dark");
    expect(root.style.colorScheme).toBe("dark");
  });
});
