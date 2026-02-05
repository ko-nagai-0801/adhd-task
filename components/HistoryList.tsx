/* components/HistoryList.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/lib/types";

function fmt(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Filter = "today" | "7d" | "all";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function HistoryList() {
  const { hydrated, tasks, undoDoneToInbox, move } = useTasks();
  const [filter, setFilter] = useState<Filter>("7d");

  const [nowTs, setNowTs] = useState<number>(0);

  useEffect(() => {
    const t0 = window.setTimeout(() => setNowTs(Date.now()), 0);
    const id = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(id);
    };
  }, []);

  const from7d = nowTs ? nowTs - 7 * 24 * 60 * 60 * 1000 : 0;

  const done = useMemo(() => {
    const list = tasks
      .filter((t) => t.status === "done" && t.doneAt)
      .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));

    if (filter === "all") return list;

    if (filter === "today") {
      const now = nowTs ? new Date(nowTs) : new Date(0);
      return list.filter((t) => isSameDay(new Date(t.doneAt!), now));
    }

    if (!nowTs) return list;
    return list.filter((t) => (t.doneAt ?? 0) >= from7d);
  }, [tasks, filter, nowTs, from7d]);

  const stat7d = useMemo(() => {
    if (!nowTs) return 0;
    return tasks.filter(
      (t) => t.status === "done" && (t.doneAt ?? 0) >= from7d
    ).length;
  }, [tasks, nowTs, from7d]);

  if (!hydrated) return <div className="text-sm muted">読み込み中…</div>;

  return (
    <div className="flex flex-col gap-4">
      <section className="card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold">達成ログ</h2>
            <p className="text-sm muted mt-1">
              「やった」が見えると、自己評価が戻りやすいです。
            </p>
          </div>
          <div className="text-sm">
            7日で <span className="font-semibold">{stat7d}</span> 件 完了
          </div>
        </div>

        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("today")}
            className={`px-3 py-2 text-xs ${
              filter === "today" ? "btn-primary" : "btn-outline"
            }`}
          >
            今日
          </button>
          <button
            onClick={() => setFilter("7d")}
            className={`px-3 py-2 text-xs ${
              filter === "7d" ? "btn-primary" : "btn-outline"
            }`}
          >
            7日
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-2 text-xs ${
              filter === "all" ? "btn-primary" : "btn-outline"
            }`}
          >
            全部
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        {done.length ? (
          done.map((t: Task) => (
            <div
              key={t.id}
              className="card p-3 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium break-words">{t.title}</div>
                <div className="text-xs muted mt-1">完了: {fmt(t.doneAt)}</div>
              </div>

              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={() => undoDoneToInbox(t.id)}
                  className="btn-outline px-3 py-2 text-xs"
                >
                  もう一度（メモ箱）
                </button>
                <button
                  onClick={() => move(t.id, "today_next")}
                  className="btn-primary px-3 py-2 text-xs"
                >
                  今日に出す
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-4 text-sm muted">
            まだ達成はありません。小さく1個でOKです。
          </div>
        )}
      </section>
    </div>
  );
}
