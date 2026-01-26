const THEME_KEY = "nostressia_theme";

export const getStoredTheme = () => {
  if (typeof window === "undefined") return "light";
  const storedTheme = localStorage.getItem(THEME_KEY);
  return storedTheme === "dark" ? "dark" : "light";
};

export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark = theme === "dark";
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
};

export const setStoredTheme = (theme) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_KEY, theme);
  }
  applyTheme(theme);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("nostressia:theme-change", { detail: { theme } })
    );
  }
};
