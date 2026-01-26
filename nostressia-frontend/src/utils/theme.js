const THEME_KEY = "nostressia_theme";
const AVAILABLE_THEMES = ["light", "dark", "system"];
let mediaQueryList;
let mediaQueryHandler;

const normalizeTheme = (theme) =>
  AVAILABLE_THEMES.includes(theme) ? theme : "system";

const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const getResolvedTheme = (theme) => {
  const selected = normalizeTheme(theme || getStoredTheme());
  return selected === "system" ? getSystemTheme() : selected;
};

const applyResolvedTheme = (resolvedTheme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark = resolvedTheme === "dark";
  root.classList.toggle("dark", isDark);
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
};

const ensureSystemListener = () => {
  if (typeof window === "undefined") return;
  if (!mediaQueryList) {
    mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
  }
  if (!mediaQueryHandler) {
    mediaQueryHandler = (event) => {
      if (getStoredTheme() !== "system") return;
      const resolvedTheme = event.matches ? "dark" : "light";
      applyResolvedTheme(resolvedTheme);
      window.dispatchEvent(
        new CustomEvent("nostressia:theme-change", {
          detail: { theme: "system", resolvedTheme },
        })
      );
    };
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", mediaQueryHandler);
    } else {
      mediaQueryList.addListener(mediaQueryHandler);
    }
  }
};

const removeSystemListener = () => {
  if (!mediaQueryList || !mediaQueryHandler) return;
  if (mediaQueryList.removeEventListener) {
    mediaQueryList.removeEventListener("change", mediaQueryHandler);
  } else {
    mediaQueryList.removeListener(mediaQueryHandler);
  }
  mediaQueryHandler = null;
};

export const getStoredTheme = () => {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_KEY) || "system";
  return normalizeTheme(stored);
};

export const applyTheme = (theme) => {
  const normalizedTheme = normalizeTheme(theme);
  const resolvedTheme = getResolvedTheme(normalizedTheme);
  applyResolvedTheme(resolvedTheme);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.dataset.themePreference = normalizedTheme;
  }
  if (normalizedTheme === "system") {
    ensureSystemListener();
  } else {
    removeSystemListener();
  }
};

export const setStoredTheme = (theme) => {
  const normalizedTheme = normalizeTheme(theme);
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_KEY, normalizedTheme);
  }
  applyTheme(normalizedTheme);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("nostressia:theme-change", {
        detail: {
          theme: normalizedTheme,
          resolvedTheme: getResolvedTheme(normalizedTheme),
        },
      })
    );
  }
};