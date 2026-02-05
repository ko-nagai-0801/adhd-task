/* components/NowBar.tsx */
"use client";

import Link from "next/link";
import { useTasks } from "@/hooks/useTasks";

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function NowBar() {
  const { hydrated, tasks, completeNow, move } = useTasks();
  const nowTask = tasks.find((t) => t.status === "today_now");

  if (!hydrated) {
    return (
      <div className="card p-3">
        <div className="text-sm muted">Nowを読み込み中…</div>
      </div>
    );
  }

  if (!nowTask) {
    return (
      <div className="card p-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">Now（いまやる1個）</div>
          <div className="text-xs muted mt-1">
            いまは空です。Inboxで「今日やる」を選ぶと、ここに出ます。
          </div>
        </div>

        <Link
          href="/inbox"
          className="rounded-xl bg-black px-3 py-2 text-xs text-white shrink-0"
        >
          Inboxへ
        </Link>
      </div>
    );
  }

  return (
    <div className="sticky top-3 z-10">
      <div className="card p-3 border-2 border-black bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs muted">Now（いまやる1個）</div>
            <div className="mt-1 text-base font-semibold break-words">
              {nowTask.title}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap shrink-0 justify-end">
            <button
              onClick={() => completeNow()}
              className={cx("rounded-xl bg-black px-3 py-2 text-xs text-white")}
            >
              完了
            </button>
            <button
              onClick={() => move(nowTask.id, "today_next")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            >
              Nextへ
            </button>
            <Link
              href="/app"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            >
              Todayへ
            </Link>
          </div>
        </div>

        <div className="mt-2 text-xs muted">
          迷ったら、まずこの1個だけ。
        </div>
      </div>
    </div>
  );
}
