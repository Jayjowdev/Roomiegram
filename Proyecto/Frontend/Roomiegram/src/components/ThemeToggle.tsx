import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "roomiegram.theme";

type ThemeMode = "light" | "dark";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", theme === "dark");
    document.body.classList.toggle("theme-light", theme === "light");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="theme-toggle-mark" aria-hidden="true">{isDark ? "C" : "O"}</span>
      <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}
