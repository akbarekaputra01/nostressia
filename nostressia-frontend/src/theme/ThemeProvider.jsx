import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { storage, STORAGE_KEYS } from "../utils/storage";

const AVAILABLE_THEMES = ["light", "dark", "system"];

const ThemeContext = createContext(null);

const normalizeTheme = (theme) => {
  const normalized = String(theme || "").toLowerCase();
  return AVAILABLE_THEMES.includes(normalized) ? normalized : "system";
};

const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const resolveTheme = (preference) =>
  preference === "system" ? getSystemTheme() : preference;

const applyResolvedTheme = (preference, resolvedTheme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark = resolvedTheme === "dark";
  root.classList.toggle("dark", isDark);
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;
};

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(() => {
    if (typeof window === "undefined") return "system";
    return normalizeTheme(storage.getItem(STORAGE_KEYS.THEME_PREFERENCE));
  });
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(preference));

  const setPreference = useCallback((nextPreference) => {
    const normalized = normalizeTheme(nextPreference);
    if (typeof window !== "undefined") {
      storage.setItem(STORAGE_KEYS.THEME_PREFERENCE, normalized);
    }
    const nextResolved = resolveTheme(normalized);
    setPreferenceState(normalized);
    setResolvedTheme(nextResolved);
    applyResolvedTheme(normalized, nextResolved);
  }, []);

  React.useEffect(() => {
    const nextResolved = resolveTheme(preference);
    setResolvedTheme(nextResolved);
    applyResolvedTheme(preference, nextResolved);
  }, [preference]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (preference !== "system") return undefined;
    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      const nextResolved = event.matches ? "dark" : "light";
      setResolvedTheme(nextResolved);
      applyResolvedTheme("system", nextResolved);
    };
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", handleChange);
    } else {
      mediaQueryList.addListener(handleChange);
    }
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", handleChange);
      } else {
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [preference]);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
    }),
    [preference, resolvedTheme, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
