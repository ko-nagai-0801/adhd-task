/* hooks/useKeyboardShortcuts.ts */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTasks } from "@/hooks/useTasks";

/**
 * グローバルキーボードショートカット
 *
 * 全ページ共通:
 *   n   QuickAdd入力欄にフォーカス
 *   ?   ショートカットヘルプ表示/非表示
 *   Esc ヘルプを閉じる
 *   d   Nowタスク完了
 *   i   メモ箱ページへ遷移
 *   t   今日ページへ遷移
 *   h   履歴ページへ遷移
 *
 * Today画面固有:
 *   j     Nextリスト内の次タスクにフォーカス移動
 *   k     Nextリスト内の前タスクにフォーカス移動
 *   Enter フォーカス中のNextタスクをNowに昇格
 *   Space フォーカス中のNextタスクの詳細を開く（ボタンクリック）
 *
 * テキスト入力中は無効化
 */

export function useKeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const pathname = usePathname();
  const { tasks, completeNow, setNow } = useTasks();
  const focusedRef = useRef(focusedTaskId);
  focusedRef.current = focusedTaskId;

  const toggleHelp = useCallback(() => setShowHelp((v) => !v), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);

  // Nextタスク一覧（Today画面で使用）
  const nextTasks = tasks
    .filter((t) => t.status === "today_next")
    .sort((a, b) => a.order - b.order);

  // パス変更時にフォーカスをリセット
  useEffect(() => {
    setFocusedTaskId(null);
  }, [pathname]);

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

      const isToday = pathname === "/app";

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
          if (focusedRef.current) {
            e.preventDefault();
            setFocusedTaskId(null);
          } else if (showHelp) {
            e.preventDefault();
            closeHelp();
          }
          break;
        }

        // 全ページ共通: ナビゲーション
        case "d": {
          e.preventDefault();
          completeNow();
          break;
        }
        case "i": {
          e.preventDefault();
          window.location.href = "/inbox";
          break;
        }
        case "t": {
          e.preventDefault();
          window.location.href = "/app";
          break;
        }
        case "h": {
          e.preventDefault();
          window.location.href = "/history";
          break;
        }

        // Today画面固有: j/k でNextリスト内フォーカス移動
        case "j": {
          if (!isToday || nextTasks.length === 0) break;
          e.preventDefault();
          setFocusedTaskId((prev) => {
            const idx = nextTasks.findIndex((t) => t.id === prev);
            if (idx < 0) return nextTasks[0].id;
            return nextTasks[Math.min(idx + 1, nextTasks.length - 1)].id;
          });
          break;
        }
        case "k": {
          if (!isToday || nextTasks.length === 0) break;
          e.preventDefault();
          setFocusedTaskId((prev) => {
            const idx = nextTasks.findIndex((t) => t.id === prev);
            if (idx < 0) return nextTasks[0].id;
            return nextTasks[Math.max(idx - 1, 0)].id;
          });
          break;
        }

        // Today画面固有: Enter でフォーカス中のタスクをNowに昇格
        case "Enter": {
          if (!isToday || !focusedRef.current) break;
          e.preventDefault();
          setNow(focusedRef.current);
          setFocusedTaskId(null);
          break;
        }

        // Today画面固有: Space でフォーカス中のタスクの詳細を開く
        case " ": {
          if (!isToday || !focusedRef.current) break;
          e.preventDefault();
          // data-task-id 属性でDOM要素を探し、詳細ボタンをクリック
          const el = document.querySelector(
            `[data-task-id="${focusedRef.current}"]`
          );
          if (el) {
            const detailBtn = el.querySelector<HTMLButtonElement>(
              "[data-action='detail']"
            );
            if (detailBtn) detailBtn.click();
          }
          break;
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showHelp, toggleHelp, closeHelp, pathname, nextTasks, completeNow, setNow]);

  /** フォーカス表示用のCSS class を返す */
  const getFocusClass = useCallback(
    (taskId: string) =>
      focusedTaskId === taskId ? "keyboard-focus-highlight" : "",
    [focusedTaskId]
  );

  return { showHelp, closeHelp, focusedTaskId, getFocusClass };
}
