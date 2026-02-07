/* components/KeyboardHelp.tsx */
"use client";

import { useEffect, useRef } from "react";

type ShortcutEntry = {
  key: string;
  description: string;
};

type ShortcutSection = {
  title: string;
  shortcuts: ShortcutEntry[];
};

const sections: ShortcutSection[] = [
  {
    title: "共通",
    shortcuts: [
      { key: "n", description: "メモ箱に素早く追加（入力欄にフォーカス）" },
      { key: "d", description: "Nowタスクを完了" },
      { key: "t", description: "今日ページへ移動" },
      { key: "i", description: "メモ箱ページへ移動" },
      { key: "h", description: "履歴ページへ移動" },
      { key: "?", description: "このショートカット一覧を表示 / 非表示" },
      { key: "Esc", description: "この一覧を閉じる / フォーカス解除" },
    ],
  },
  {
    title: "今日ページ",
    shortcuts: [
      { key: "j", description: "Nextリスト内の次タスクにフォーカス" },
      { key: "k", description: "Nextリスト内の前タスクにフォーカス" },
      { key: "Enter", description: "フォーカス中のタスクをNowに昇格" },
      { key: "Space", description: "フォーカス中のタスクの詳細を開く" },
    ],
  },
];

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

        {sections.map((section) => (
          <div key={section.title} className="mb-4 last:mb-0">
            <h3 className="text-xs font-semibold muted mb-1.5">
              {section.title}
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {section.shortcuts.map((s) => (
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
        ))}
      </div>
    </div>
  );
}
