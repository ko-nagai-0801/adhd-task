/* components/HistoryList.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTasks } from "@/hooks/useTasks";

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

  // render中に Date.now() を呼ばない（purityルール対策）
  const [nowTs, setNowTs] = useState<number>(0);

  useEffect(() => {
    // ✅ setState を effect 本体で同期実行しない（lint対策）
    const t0 = window.setTimeout(() => setNowTs(Date.now()), 0);
    const id = window.setInterval(() => setNowTs(Date.now()), 60_000); // 1分ごとに更新

    return () => {
      window.clearTimeout(t0);
      window.clearInterval(id);
    };
  }, []);

  const done = useMemo(() => {
    const list = tasks
      .filter((t) => t.status === "done" && t.doneAt)
      .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));

    // nowがまだ入っていない初回だけは一覧そのまま
    if (!nowTs || filter === "all") return list;

    if (filter === "today") {
      const today = new Date(nowTs);
      return list.filter((t) => isSameDay(new Date(t.doneAt!), today));
    }

    // 7d
    const from = nowTs - 7 * 24 * 60 * 60 * 1000;
    return list.filter((t) => (t.doneAt ?? 0) >= from);
  }, [tasks, filter, nowTs]);

  const stat7d = useMemo(() => {
    if (!nowTs) {
      return tasks.filter((t) => t.status === "done" && t.doneAt).length;
    }
    const from = nowTs - 7 * 24 * 60 * 60 * 1000;
    return tasks.filter((t) => t.status === "done" && (t.doneAt ?? 0) >= from).length;
  }, [tasks, nowTs]);

  if (!hydrated) {
    return <div className="text-sm muted">読み込み中…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold">History（完了ログ）</h2>
            <p className="text-sm muted mt-1">「やった」が見えると、自己評価が戻りやすいです。</p>
          </div>
          <div className="text-sm">
            7日で <span className="font-semibold">{stat7d}</span> 件 完了
          </div>
        </div>

        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("today")}
            className={`rounded-xl border px-3 py-2 text-xs ${
              filter === "today" ? "bg-black text-white border-black" : "bg-white border-slate-200"
            }`}
          >
            今日
          </button>
          <button
            onClick={() => setFilter("7d")}
            className={`rounded-xl border px-3 py-2 text-xs ${
              filter === "7d" ? "bg-black text-white border-black" : "bg-white border-slate-200"
            }`}
          >
            7日
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl border px-3 py-2 text-xs ${
              filter === "all" ? "bg-black text-white border-black" : "bg-white border-slate-200"
            }`}
          >
            全部
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        {done.length ? (
          done.map((t) => (
            <div key={t.id} className="card p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium break-words">{t.title}</div>
                <div className="text-xs muted mt-1">完了: {fmt(t.doneAt)}</div>
              </div>

              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={() => undoDoneToInbox(t.id)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  もう一度（Inbox）
                </button>
                <button
                  onClick={() => move(t.id, "today_next")}
                  className="rounded-xl bg-black px-3 py-2 text-xs text-white"
                >
                  今日に出す
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-4 text-sm muted">完了ログはまだありません。小さく1個、積み上げましょう。</div>
        )}
      </section>
    </div>
  );
}
