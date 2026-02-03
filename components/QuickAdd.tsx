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

    addTask(title); // 追加は必ずInboxへ（仕様）
    setValue("");
  };

  const inboxCount = tasks.filter((t) => t.status === "inbox").length;

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
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="いま思いついたことを1行で（Enterで追加）"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          inputMode="text"
        />
        <button type="submit" className="rounded-xl bg-black px-4 py-2 text-sm text-white">
          Inboxに追加
        </button>
      </form>

      <div className="mt-2 text-xs muted">Inbox: {inboxCount} 件</div>
    </div>
  );
}
