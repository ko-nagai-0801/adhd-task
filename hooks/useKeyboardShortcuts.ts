/* hooks/useKeyboardShortcuts.ts */
"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * グローバルキーボードショートカット
 * - n: QuickAdd入力欄にフォーカス
 * - ?: ショートカットヘルプ表示/非表示
 * - テキスト入力中は無効化
 */
export function useKeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);

  const toggleHelp = useCallback(() => setShowHelp((v) => !v), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // テキスト入力中はショートカット無効化
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        // ESCだけは入力中でもヘルプを閉じる
        if (e.key === "Escape" && showHelp) {
          closeHelp();
        }
        return;
      }

      // contentEditable要素内も無効化
      if ((e.target as HTMLElement)?.isContentEditable) return;

      switch (e.key) {
        case "n": {
          e.preventDefault();
          const input = document.getElementById("quick-add-input");
          if (input) input.focus();
          break;
        }
        case "?": {
          e.preventDefault();
          toggleHelp();
          break;
        }
        case "Escape": {
          if (showHelp) {
            e.preventDefault();
            closeHelp();
          }
          break;
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showHelp, toggleHelp, closeHelp]);

  return { showHelp, closeHelp };
}
