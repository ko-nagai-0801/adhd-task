/* components/ThemeToggle.tsx */
"use client";

import { useTheme } from "@/hooks/useTheme";

function label(theme: "system" | "light" | "dark") {
  if (theme === "system") return "自動";
  if (theme === "light") return "ライト";
  return "ダーク";
}

export default function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="btn-outline px-3 py-2 text-xs"
      title="表示モード（自動→ライト→ダーク）"
    >
      表示: <span className="font-semibold">{label(theme)}</span>
    </button>
  );
}
