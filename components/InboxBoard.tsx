/* components/InboxBoard.tsx */
"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/lib/types";

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
        <div className="text-xs muted mt-1">受け皿に置いてOK。選別は“あとで”で十分。</div>
      </div>
      <div className="flex gap-2 shrink-0 flex-wrap justify-end">{actions}</div>
    </div>
  );
}

export default function InboxBoard() {
  const { hydrated, tasks, move, setNow, restoreDiscarded } = useTasks();
  const [showDiscarded, setShowDiscarded] = useState(false);

  if (!hydrated) {
    return <div className="text-sm muted">読み込み中…</div>;
  }

  const inbox = tasks
    .filter((t) => t.status === "inbox")
    .sort((a, b) => a.order - b.order);

  const later = tasks
    .filter((t) => t.status === "later")
    .sort((a, b) => a.order - b.order);

  const discarded = tasks
    .filter((t) => t.status === "discarded")
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  const moveToToday = (id: string) => {
    // Todayへは基本Nextへ入れる。ただしNowが空ならNowにする（迷いを減らす）
    const hasNow = tasks.some((t) => t.status === "today_now");
    if (hasNow) move(id, "today_next");
    else setNow(id); // setNow は自動で他NowをNextへ落とす
  };

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-base font-semibold mb-2">Inbox（受け皿）</h2>
        <div className="flex flex-col gap-2">
          {inbox.length ? (
            inbox.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                actions={
                  <>
                    <button
                      onClick={() => moveToToday(t.id)}
                      className="rounded-xl bg-black px-3 py-2 text-xs text-white"
                    >
                      今日やる
                    </button>
                    <button
                      onClick={() => move(t.id, "later")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      あとで
                    </button>
                    <button
                      onClick={() => move(t.id, "discarded")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      やらない
                    </button>
                  </>
                }
              />
            ))
          ) : (
            <div className="card p-4 text-sm muted">Inboxは空です。思いついたら上の入力で放り込めばOKです。</div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-2">Later（あとで）</h2>
        <div className="flex flex-col gap-2">
          {later.length ? (
            later.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                actions={
                  <>
                    <button
                      onClick={() => moveToToday(t.id)}
                      className="rounded-xl bg-black px-3 py-2 text-xs text-white"
                    >
                      今日やる
                    </button>
                    <button
                      onClick={() => move(t.id, "inbox")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      Inboxへ
                    </button>
                    <button
                      onClick={() => move(t.id, "discarded")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      やらない
                    </button>
                  </>
                }
              />
            ))
          ) : (
            <div className="card p-4 text-sm muted">Laterは空です。「あとで」に逃がすだけでも十分前進です。</div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Discarded（やらない）</h2>
          <button
            onClick={() => setShowDiscarded((v) => !v)}
            className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            {showDiscarded ? "隠す" : `表示（${discarded.length}）`}
          </button>
        </div>

        {showDiscarded ? (
          <div className="mt-2 flex flex-col gap-2">
            {discarded.length ? (
              discarded.map((t) => (
                <div key={t.id} className="card p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium break-words">{t.title}</div>
                    <div className="text-xs muted mt-1">復元できます（判断ミス対策）。</div>
                  </div>
                  <button
                    onClick={() => restoreDiscarded(t.id)}
                    className="rounded-xl bg-black px-3 py-2 text-xs text-white"
                  >
                    Inboxに戻す
                  </button>
                </div>
              ))
            ) : (
              <div className="card p-4 text-sm muted">やらないタスクはありません。</div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
