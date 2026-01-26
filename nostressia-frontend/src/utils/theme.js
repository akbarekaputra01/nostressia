const THEME_KEY = "nostressia_theme";
const DEFAULT_THEME = "light";

const normalizeTheme = (theme) => (theme === "dark" ? "dark" : "light");

export const getStoredTheme = () => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }
  localStorage.setItem(THEME_KEY, DEFAULT_THEME);
  return DEFAULT_THEME;
};

export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const normalizedTheme = normalizeTheme(theme);
  const isDark = normalizedTheme === "dark";
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
};

export const setStoredTheme = (theme) => {
  const normalizedTheme = normalizeTheme(theme);
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_KEY, normalizedTheme);
  }
  applyTheme(normalizedTheme);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("nostressia:theme-change", { detail: { theme: normalizedTheme } })
    );
  }
};
