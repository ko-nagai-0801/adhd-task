/* components/NowBar.tsx */
"use client";

import Link from "next/link";
import { useTasks } from "@/hooks/useTasks";

export default function NowBar() {
  const { hydrated, tasks, completeNow, move } = useTasks();

  if (!hydrated) return null;

  const nowTask = tasks.find((t) => t.status === "today_now");
  if (!nowTask) return null;

  return (
    <div className="card--focus p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-xs muted">いまやる1個</div>
          <div className="text-base font-semibold break-words">{nowTask.title}</div>
          <div className="text-xs muted mt-1">迷ったら、まずこの1個だけ。</div>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={() => completeNow()} className="btn-primary px-4 py-2 text-sm">
            完了
          </button>
          <button
            onClick={() => move(nowTask.id, "today_next")}
            className="btn-outline px-4 py-2 text-sm"
          >
            次へ
          </button>
          <button
            onClick={() => move(nowTask.id, "inbox")}
            className="btn-outline px-4 py-2 text-sm"
          >
            メモ箱へ
          </button>
          <Link href="/app" className="btn-outline px-4 py-2 text-sm">
            今日へ
          </Link>
        </div>
      </div>
    </div>
  );
}
