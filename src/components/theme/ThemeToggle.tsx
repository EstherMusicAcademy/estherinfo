"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { IconMoon, IconSun } from "@/components/icons/UiIcons";

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-lg hover:bg-surface"
      onClick={toggleMode}
      aria-label="테마 전환(라이트/다크)"
      title="테마 전환(라이트/다크)"
    >
      {mode === "dark" ? <IconMoon /> : <IconSun />}
    </button>
  );
}

