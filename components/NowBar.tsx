/* components/NowBar.tsx */
"use client";

import Link from "next/link";
import { useTasks } from "@/hooks/useTasks";

export default function NowBar() {
  const { hydrated, tasks, completeNow, move } = useTasks();
  const nowTask = tasks.find((t) => t.status === "today_now");

  if (!hydrated) {
    return (
      <div className="card p-3">
        <div className="text-sm muted">読み込み中…</div>
      </div>
    );
  }

  if (!nowTask) {
    return (
      <div className="card p-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">いまやる1個</div>
          <div className="text-xs muted mt-1">空です。受け皿で「今日やる」を選ぶと出ます。</div>
        </div>

        <Link href="/inbox" className="btn-primary px-3 py-2 text-xs shrink-0">
          受け皿へ
        </Link>
      </div>
    );
  }

  return (
    <div className="sticky top-3 z-10">
      <div className="card--focus p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs muted">いまやる1個</div>
            <div className="mt-1 text-base font-semibold break-words">{nowTask.title}</div>
          </div>

          <div className="flex gap-2 flex-wrap shrink-0 justify-end">
            <button onClick={() => completeNow()} className="btn-primary px-3 py-2 text-xs">
              完了
            </button>
            <button onClick={() => move(nowTask.id, "today_next")} className="btn-outline px-3 py-2 text-xs">
              次へ
            </button>
            <Link href="/app" className="btn-outline px-3 py-2 text-xs">
              今日へ
            </Link>
          </div>
        </div>

        <div className="mt-2 text-xs muted">迷ったら、まずこの1個だけ。</div>
      </div>
    </div>
  );
}
