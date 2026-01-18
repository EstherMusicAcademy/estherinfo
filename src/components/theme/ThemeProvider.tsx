"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  mode: ThemeMode; // 현재 실제 적용(시스템 포함)
  toggleMode: () => void; // UI 선택지는 라이트/다크만
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme-preference";

function applyPreference(p: ThemePreference) {
  const root = document.documentElement;
  if (p === "system") {
    root.removeAttribute("data-theme");
    return;
  }
  root.setAttribute("data-theme", p);
}

function getSystemMode(): ThemeMode {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    // 요구사항: 선택지는 라이트/다크만. 저장값도 light/dark만 저장. 없으면 system.
    const pref: ThemePreference = savedRaw === "light" || savedRaw === "dark" ? savedRaw : "system";
    setPreferenceState(pref);
    applyPreference(pref);
    setMode(pref === "system" ? getSystemMode() : pref);
  }, []);

  useEffect(() => {
    // 시스템 테마 변경 시, preference=system이면 즉시 반영되도록 강제(= data-theme 제거 상태 유지)
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = () => {
      if (preference === "system") {
        applyPreference("system");
        setMode(getSystemMode());
      }
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [preference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      mode,
      setPreference: (p) => {
        setPreferenceState(p);
        if (p === "system") {
          localStorage.removeItem(STORAGE_KEY);
          applyPreference("system");
          setMode(getSystemMode());
          return;
        }
        localStorage.setItem(STORAGE_KEY, p);
        applyPreference(p);
        setMode(p);
      },
      toggleMode: () => {
        // UI 선택지는 라이트/다크만. default(system) 상태에서도 버튼을 누르면 반대 모드로 "고정"한다.
        const current = preference === "system" ? getSystemMode() : preference;
        const next: ThemeMode = current === "dark" ? "light" : "dark";
        setPreferenceState(next);
        localStorage.setItem(STORAGE_KEY, next);
        applyPreference(next);
        setMode(next);
      },
    }),
    [preference, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

