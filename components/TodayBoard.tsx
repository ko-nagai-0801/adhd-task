/* components/TodayBoard.tsx */
"use client";

import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/lib/types";

function fmt(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function TaskRow({
  task,
  actions,
}: {
  task: Task;
  actions: React.ReactNode;
}) {
  return (
    <div className="card p-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium break-words">{task.title}</div>
        <div className="text-xs muted mt-1">作成: {fmt(task.createdAt)}</div>
      </div>
      <div className="flex gap-2 shrink-0 flex-wrap justify-end">{actions}</div>
    </div>
  );
}

export default function TodayBoard() {
  const { hydrated, tasks, setNow, completeNow, move, reorderNext } = useTasks();

  if (!hydrated) {
    return <div className="text-sm muted">読み込み中…</div>;
  }

  const nowTask = tasks.find((t) => t.status === "today_now");
  const nextTasks = tasks
    .filter((t) => t.status === "today_next")
    .sort((a, b) => a.order - b.order);

  const doneToday = tasks
    .filter((t) => t.status === "done" && t.doneAt)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-base font-semibold mb-2">Now（いまやる1個）</h2>

        {nowTask ? (
          <div className="card p-4">
            <div className="text-lg font-semibold break-words">{nowTask.title}</div>
            <div className="text-xs muted mt-1">選ばれたタスク。終えたら「完了」で次へ。</div>

            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={() => completeNow()}
                className="rounded-xl bg-black px-4 py-2 text-sm text-white"
              >
                完了
              </button>
              <button
                onClick={() => move(nowTask.id, "today_next")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
              >
                Nextに戻す
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-4 text-sm muted">Nowが空です。Inboxから「今日やる」を選ぶか、Nextから「今やる」を押してください。</div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-2">Next（次にやる）</h2>

        <div className="flex flex-col gap-2">
          {nextTasks.length ? (
            nextTasks.map((t, i) => (
              <TaskRow
                key={t.id}
                task={t}
                actions={
                  <>
                    <button
                      onClick={() => setNow(t.id)}
                      className="rounded-xl bg-black px-3 py-2 text-xs text-white"
                    >
                      今やる
                    </button>
                    <button
                      onClick={() => move(t.id, "inbox")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      Inboxへ
                    </button>
                    <button
                      onClick={() => reorderNext(t.id, "up")}
                      disabled={i === 0}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => reorderNext(t.id, "down")}
                      disabled={i === nextTasks.length - 1}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </>
                }
              />
            ))
          ) : (
            <div className="card p-4 text-sm muted">Nextは空です。Inboxで「今日やる」を選ぶとここ（またはNow）に入ります。</div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-2">Done（直近）</h2>
        <div className="flex flex-col gap-2">
          {doneToday.length ? (
            doneToday.map((t) => (
              <div key={t.id} className="card p-3">
                <div className="text-sm font-medium break-words">{t.title}</div>
                <div className="text-xs muted mt-1">完了: {fmt(t.doneAt)}</div>
              </div>
            ))
          ) : (
            <div className="card p-4 text-sm muted">まだ完了はありません。小さく1個終わらせるのが勝ちです。</div>
          )}
        </div>
      </section>
    </div>
  );
}
