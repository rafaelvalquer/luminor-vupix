import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const THEME_STORAGE_KEY = "luminor_vupix_theme";

const ThemeContext = createContext(null);

function readStoredTheme() {
  if (typeof window === "undefined") return "";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "";
}

function readSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveInitialTheme() {
  return readStoredTheme() || readSystemTheme();
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(resolveInitialTheme);
  const [themeSource, setThemeSource] = useState(() =>
    readStoredTheme() ? "manual" : "system"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (themeSource !== "system") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      setThemeState(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themeSource]);

  const setTheme = useCallback((nextTheme) => {
    const normalized = nextTheme === "dark" ? "dark" : "light";
    window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
    setThemeSource("manual");
    setThemeState(normalized);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const resetTheme = useCallback(() => {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    setThemeSource("system");
    setThemeState(readSystemTheme());
  }, []);

  const value = useMemo(
    () => ({
      theme,
      themeSource,
      setTheme,
      toggleTheme,
      resetTheme,
      isDark: theme === "dark",
    }),
    [theme, themeSource, setTheme, toggleTheme, resetTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
