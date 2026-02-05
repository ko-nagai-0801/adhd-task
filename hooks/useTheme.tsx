/* hooks/useTheme.tsx */
"use client";

import { useCallback, useEffect, useState } from "react";
import { applyThemeClass, getStoredTheme, setStoredTheme, type Theme } from "@/lib/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  // 初期同期（effect本体で同期setStateしない lint 対策）
  useEffect(() => {
    const t0 = window.setTimeout(() => {
      const stored = getStoredTheme() ?? "system";
      setThemeState(stored);
      applyThemeClass(stored);
    }, 0);

    return () => window.clearTimeout(t0);
  }, []);

  // system のときだけ OS 変更に追従（DOM更新＝外部システム同期）
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = () => {
      const current = getStoredTheme() ?? theme;
      if (current === "system") applyThemeClass("system");
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setStoredTheme(next);
    applyThemeClass(next);
  }, []);

  const cycleTheme = useCallback(() => {
    const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  }, [theme, setTheme]);

  return { theme, setTheme, cycleTheme };
}
