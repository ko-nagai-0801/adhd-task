/* components/KeyboardHelp.tsx */
"use client";

import { useEffect, useRef } from "react";

const shortcuts = [
  { key: "n", description: "メモ箱に素早く追加（入力欄にフォーカス）" },
  { key: "?", description: "このショートカット一覧を表示 / 非表示" },
  { key: "Esc", description: "この一覧を閉じる" },
] as const;

export default function KeyboardHelp({ onClose }: { onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // オーバーレイ背景クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-label="キーボードショートカット一覧"
      aria-modal="true"
      className="keyboard-help-overlay"
    >
      <div className="keyboard-help-dialog card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">キーボードショートカット</h2>
          <button
            onClick={onClose}
            className="btn-outline px-2 py-1 text-xs"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <table className="w-full text-sm">
          <tbody>
            {shortcuts.map((s) => (
              <tr key={s.key} className="keyboard-help-row">
                <td className="py-1.5 pr-4">
                  <kbd className="keyboard-help-kbd">{s.key}</kbd>
                </td>
                <td className="py-1.5 muted">{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
