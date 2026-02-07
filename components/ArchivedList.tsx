/* components/ArchivedList.tsx */
"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";

const DAY_MS = 86_400_000;
const ARCHIVE_DISPLAY_DAYS = 30;

export default function ArchivedList() {
  const { tasks, restoreArchived } = useTasks();
  const [expanded, setExpanded] = useState(false);

  const now = Date.now();

  const archived = tasks
    .filter(
      (t) => t.archivedAt && now - t.archivedAt <= ARCHIVE_DISPLAY_DAYS * DAY_MS
    )
    .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));

  if (archived.length === 0) return null;

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">アーカイブ</h2>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="btn-outline px-3 py-1 text-xs"
          aria-expanded={expanded}
          aria-label={expanded ? "アーカイブを隠す" : "アーカイブを表示する"}
        >
          {expanded ? "隠す" : `表示（${archived.length}件）`}
        </button>
      </div>
      <p className="text-xs muted mt-1">
        30日以内のアーカイブ済みタスク。復元できます。
      </p>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2">
          {archived.map((t) => (
            <div
              key={t.id}
              className="card p-3 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium break-words">{t.title}</div>
                <div className="text-xs muted mt-0.5">
                  アーカイブ:{" "}
                  {t.archivedAt
                    ? new Date(t.archivedAt).toLocaleDateString("ja-JP")
                    : ""}
                </div>
              </div>
              <button
                onClick={() => restoreArchived(t.id)}
                className="btn-primary px-3 py-1 text-xs shrink-0"
                aria-label={`「${t.title}」を復元する`}
              >
                復元
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
