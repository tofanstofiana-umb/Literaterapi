"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const STORAGE_KEY = "literaterapi-sakti-theme";

type ThemeMode = "light" | "dark";

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
}

export default function ThemeToggle() {
  const t = useTranslations("theme");
  const [mode, setMode] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialMode: ThemeMode = stored === "dark" || (!stored && prefersDark) ? "dark" : "light";

    setMode(initialMode);
    applyTheme(initialMode);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
    setMode(nextMode);
    applyTheme(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  }

  const isDark = mounted && mode === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="tap-target inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-sakti-mist bg-white px-3 py-2 text-sm font-black text-sakti-forestDark shadow-sm transition hover:border-sakti-forest hover:bg-sakti-mist/35 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sakti-forest/20"
      aria-label={isDark ? t("useLight") : t("useDark")}
      title={isDark ? t("light") : t("dark")}
    >
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-black ${
          isDark
            ? "border-sakti-gold bg-sakti-gold text-sakti-forestDark"
            : "border-sakti-forest bg-sakti-paper text-sakti-forest"
        }`}
      >
        {isDark ? "G" : "T"}
      </span>
      <span className="hidden sm:inline">{isDark ? t("dark") : t("light")}</span>
    </button>
  );
}
