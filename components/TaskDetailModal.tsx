/* components/TaskDetailModal.tsx */
"use client";

import { useEffect, useRef, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import type { RecurrenceType, Task } from "@/lib/types";

type Props = {
  task: Task;
  onClose: () => void;
};

const ESTIMATE_OPTIONS = [15, 30, 45, 60] as const;
const PRIORITY_OPTIONS = [
  { value: "high", label: "高" },
  { value: "normal", label: "普通" },
  { value: "low", label: "低" },
] as const;
const RECURRENCE_OPTIONS: { value: RecurrenceType | "none"; label: string }[] = [
  { value: "none", label: "なし" },
  { value: "daily", label: "毎日" },
  { value: "weekly", label: "毎週" },
  { value: "monthly", label: "毎月" },
];

export default function TaskDetailModal({ task, onClose }: Props) {
  const {
    setDescription,
    setPriority,
    addTag,
    removeTag,
    setEstimate,
    setRecurrence,
    setLaterDue,
  } = useTasks();

  const [tagInput, setTagInput] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  // ESCで閉じる
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // overlay外クリックで閉じる
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function handleAddTag() {
    const tag = tagInput.trim();
    if (tag && !task.tags.includes(tag)) {
      addTag(task.id, tag);
    }
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }

  const recurrenceValue: RecurrenceType | "none" = task.recurrence?.type ?? "none";

  const laterDateStr = task.laterDueDate
    ? new Date(task.laterDueDate).toISOString().slice(0, 10)
    : "";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${task.title} の詳細`}
    >
      <div className="card p-5 w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold break-words">{task.title}</h2>
          <button
            onClick={onClose}
            className="btn-outline px-2 py-1 text-xs shrink-0"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <section className="mb-4">
          <label className="text-xs font-medium muted block mb-1">メモ</label>
          <textarea
            className="input w-full p-2 text-sm min-h-[80px] resize-y"
            placeholder="タスクの詳細メモ…"
            defaultValue={task.description ?? ""}
            onBlur={(e) => setDescription(task.id, e.target.value)}
          />
        </section>

        {/* Priority */}
        <section className="mb-4">
          <label className="text-xs font-medium muted block mb-1">優先度</label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPriority(task.id, opt.value)}
                className={`px-3 py-1 text-xs rounded-full ${
                  task.priority === opt.value ? "pill--active" : "pill"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Tags */}
        <section className="mb-4">
          <label className="text-xs font-medium muted block mb-1">タグ</label>
          <div className="flex gap-1 flex-wrap mb-2">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full pill"
              >
                {tag}
                <button
                  onClick={() => removeTag(task.id, tag)}
                  className="text-[10px] hover:opacity-70"
                  aria-label={`タグ「${tag}」を削除`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              className="input px-2 py-1 text-xs flex-1"
              placeholder="タグを追加…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
            <button onClick={handleAddTag} className="btn-outline px-3 py-1 text-xs">
              追加
            </button>
          </div>
        </section>

        {/* Estimate */}
        <section className="mb-4">
          <label className="text-xs font-medium muted block mb-1">見積時間</label>
          <div className="flex gap-2">
            {ESTIMATE_OPTIONS.map((min) => (
              <button
                key={min}
                onClick={() => setEstimate(task.id, min)}
                className={`px-3 py-1 text-xs rounded-full ${
                  task.estimatedMinutes === min ? "pill--active" : "pill"
                }`}
              >
                {min}分
              </button>
            ))}
          </div>
        </section>

        {/* Recurrence */}
        <section className="mb-4">
          <label className="text-xs font-medium muted block mb-1">定期タスク</label>
          <div className="flex gap-2 flex-wrap">
            {RECURRENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  setRecurrence(
                    task.id,
                    opt.value === "none" ? undefined : { type: opt.value }
                  )
                }
                className={`px-3 py-1 text-xs rounded-full ${
                  recurrenceValue === opt.value ? "pill--active" : "pill"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Later Due Date */}
        {task.status === "later" && (
          <section className="mb-4">
            <label className="text-xs font-medium muted block mb-1">Later期限</label>
            <input
              type="date"
              className="input px-2 py-1 text-xs"
              value={laterDateStr}
              onChange={(e) => {
                const d = e.target.value;
                if (d) {
                  setLaterDue(task.id, new Date(d).getTime());
                }
              }}
            />
          </section>
        )}

        {/* Meta */}
        <div className="text-[11px] muted mt-2 pt-2 border-t border-[rgb(var(--border))]">
          <div>作成: {new Date(task.createdAt).toLocaleDateString("ja-JP")}</div>
          {task.doneAt && (
            <div>完了: {new Date(task.doneAt).toLocaleDateString("ja-JP")}</div>
          )}
          {task.actualMinutes != null && <div>実績: {task.actualMinutes}分</div>}
        </div>
      </div>
    </div>
  );
}
