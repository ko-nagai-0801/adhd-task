/* components/AITaskBreaker.tsx */
"use client";

import { useState, useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";

/**
 * ルールベースのタスク分解パターン
 * 動詞を分析して適切なサブタスクを生成する
 *
 * 将来的にLLM APIに置き換え可能:
 * async function breakWithLLM(input: string): Promise<string[]> {
 *   const res = await fetch("/api/ai-break", {
 *     method: "POST",
 *     body: JSON.stringify({ task: input }),
 *   });
 *   return res.json();
 * }
 */

type BreakPattern = {
  /** 動詞パターン（正規表現） */
  verbs: RegExp;
  /** サブタスクテンプレート（{task}は元のタスク名に置換） */
  subtasks: string[];
};

const BREAK_PATTERNS: BreakPattern[] = [
  {
    verbs: /書く|執筆|作成|ライティング/,
    subtasks: [
      "リサーチする",
      "骨子を作る",
      "執筆する",
      "校正する",
    ],
  },
  {
    verbs: /プレゼン|発表|スライド/,
    subtasks: [
      "内容を整理する",
      "スライドを作成する",
      "リハーサルする",
      "フィードバックを反映する",
    ],
  },
  {
    verbs: /勉強|学習|学ぶ/,
    subtasks: [
      "教材を集める",
      "基本概念を読む",
      "ノートにまとめる",
      "練習問題を解く",
    ],
  },
  {
    verbs: /掃除|片付け|整理/,
    subtasks: [
      "不要なものを仕分ける",
      "捨てるものをまとめる",
      "残すものを配置する",
      "仕上げの拭き掃除",
    ],
  },
  {
    verbs: /買い物|購入|買う/,
    subtasks: [
      "必要なものをリストアップ",
      "予算を確認する",
      "お店に行く／注文する",
      "届いたものを確認する",
    ],
  },
  {
    verbs: /料理|作る|調理/,
    subtasks: [
      "レシピを決める",
      "材料を準備する",
      "調理する",
      "片付ける",
    ],
  },
  {
    verbs: /開発|実装|コーディング|プログラミング/,
    subtasks: [
      "要件を整理する",
      "設計する",
      "実装する",
      "テストする",
    ],
  },
  {
    verbs: /企画|計画|プランニング/,
    subtasks: [
      "目的を明確にする",
      "情報を集める",
      "案を出す",
      "計画書にまとめる",
    ],
  },
  {
    verbs: /連絡|メール|返信/,
    subtasks: [
      "内容を整理する",
      "下書きを書く",
      "確認して送信する",
    ],
  },
  {
    verbs: /引越し|引っ越し/,
    subtasks: [
      "新居を探す",
      "荷造りする",
      "搬出・搬入する",
      "荷解き・整理する",
    ],
  },
];

/** デフォルトの汎用分解 */
const DEFAULT_SUBTASKS = [
  "準備する",
  "実行する",
  "確認する",
  "完了処理",
];

function breakTask(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  for (const pattern of BREAK_PATTERNS) {
    if (pattern.verbs.test(trimmed)) {
      return pattern.subtasks.map((s) => `【${trimmed}】${s}`);
    }
  }

  return DEFAULT_SUBTASKS.map((s) => `【${trimmed}】${s}`);
}

export default function AITaskBreaker() {
  const { addTask } = useTasks();
  const [input, setInput] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  const handleBreak = useCallback(() => {
    const result = breakTask(input);
    setSubtasks(result);
    setAdded(false);
  }, [input]);

  const handleRemove = useCallback((index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAdd = useCallback((index: number) => {
    const title = window.prompt("サブタスクを追加", "");
    if (!title?.trim()) return;
    setSubtasks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, title.trim());
      return next;
    });
  }, []);

  const handleEdit = useCallback((index: number, value: string) => {
    setSubtasks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleAddAll = useCallback(() => {
    for (const title of subtasks) {
      if (title.trim()) addTask(title.trim());
    }
    setAdded(true);
    setSubtasks([]);
    setInput("");
  }, [subtasks, addTask]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleBreak();
      }
    },
    [handleBreak]
  );

  return (
    <section className="card p-4">
      <h2 className="text-base font-semibold">AIタスク分解</h2>
      <p className="text-sm muted mt-1">
        大きなタスクを小さなステップに分解します。
      </p>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setAdded(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="例: レポートを書く"
          className="input flex-1"
          aria-label="分解するタスクを入力"
        />
        <button
          onClick={handleBreak}
          disabled={!input.trim()}
          className="btn-primary px-3 py-2 text-sm"
        >
          分解する
        </button>
      </div>

      {subtasks.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium mb-2">
            サブタスク（{subtasks.length}件）
          </p>
          <ul className="space-y-1">
            {subtasks.map((task, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-xs muted w-5 text-right">{i + 1}.</span>
                <input
                  type="text"
                  value={task}
                  onChange={(e) => handleEdit(i, e.target.value)}
                  className="input flex-1 text-sm"
                  aria-label={`サブタスク ${i + 1}`}
                />
                <button
                  onClick={() => handleAdd(i)}
                  className="btn-outline px-2 py-1 text-xs"
                  aria-label="下に追加"
                  title="下にサブタスクを追加"
                >
                  +
                </button>
                <button
                  onClick={() => handleRemove(i)}
                  className="btn-outline px-2 py-1 text-xs"
                  aria-label="削除"
                  title="このサブタスクを削除"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={handleAddAll}
            disabled={subtasks.length === 0}
            className="btn-primary px-4 py-2 text-sm mt-3"
          >
            すべてメモ箱に追加
          </button>
        </div>
      )}

      {added && (
        <p className="text-xs mt-2 text-green-600 dark:text-green-400">
          メモ箱に追加しました！
        </p>
      )}
    </section>
  );
}
