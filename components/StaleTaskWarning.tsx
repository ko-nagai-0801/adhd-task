/* components/StaleTaskWarning.tsx */
"use client";

import { useTasks } from "@/hooks/useTasks";

const DAY_MS = 86_400_000;
const INBOX_STALE_DAYS = 30;
const LATER_STALE_DAYS = 60;

export default function StaleTaskWarning() {
  const { tasks, move, setNow, archiveTask } = useTasks();

  const now = Date.now();

  const hasNow = tasks.some((t) => t.status === "today_now");

  const staleTasks = tasks.filter((t) => {
    if (t.archivedAt) return false;
    if (t.status === "inbox") {
      return now - t.createdAt > INBOX_STALE_DAYS * DAY_MS;
    }
    if (t.status === "later") {
      return now - t.createdAt > LATER_STALE_DAYS * DAY_MS;
    }
    return false;
  });

  if (staleTasks.length === 0) return null;

  function handleDoToday(id: string) {
    if (hasNow) move(id, "today_next");
    else setNow(id);
  }

  return (
    <section className="mb-6">
      <h3 className="text-sm font-semibold mb-2 text-amber-600 dark:text-amber-400">
        このタスク、ホントに必要？
      </h3>
      <div className="flex flex-col gap-2">
        {staleTasks.map((t) => {
          const days = Math.floor((now - t.createdAt) / DAY_MS);
          return (
            <div
              key={t.id}
              className="card p-3 border-amber-300 dark:border-amber-700 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium break-words">{t.title}</div>
                <div className="text-xs muted mt-0.5">{days}日間放置</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => archiveTask(t.id)}
                  className="btn-outline px-3 py-1 text-xs"
                  aria-label={`「${t.title}」をやらない`}
                >
                  やらない
                </button>
                <button
                  onClick={() => handleDoToday(t.id)}
                  className="btn-primary px-3 py-1 text-xs"
                  aria-label={`「${t.title}」を今日やる`}
                >
                  今日やる
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
