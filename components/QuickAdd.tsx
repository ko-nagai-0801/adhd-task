/* components/QuickAdd.tsx */
"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";

export default function QuickAdd() {
  const { addTask, tasks } = useTasks();
  const [value, setValue] = useState("");

  const submit = () => {
    const title = value.trim();
    if (!title) return;
    addTask(title);
    setValue("");
  };

  const memoCount = tasks.filter((t) => t.status === "inbox").length;

  return (
    <div className="card p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <input
          id="quick-add-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="いま思いついたことを1行で（Nキーでも開ける）"
          className="input w-full px-3 py-2 text-sm"
          inputMode="text"
          aria-label="新しいタスクを入力"
        />
        <button type="submit" className="btn-primary px-4 py-2 text-sm">
          メモ箱に追加
        </button>
      </form>

      <div className="mt-2 text-xs muted">メモ箱: {memoCount} 件</div>
    </div>
  );
}
