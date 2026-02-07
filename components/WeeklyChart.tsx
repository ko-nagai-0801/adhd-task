/* components/WeeklyChart.tsx */
"use client";

import { useMemo } from "react";
import type { Task } from "@/lib/types";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function WeeklyChart({ tasks }: { tasks: Task[] }) {
  const data = useMemo(() => {
    const now = Date.now();
    const days: { label: string; count: number; dateStr: string }[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfDay(now - i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const d = new Date(dayStart);
      const count = tasks.filter(
        (t) =>
          t.status === "done" &&
          t.doneAt &&
          t.doneAt >= dayStart &&
          t.doneAt < dayEnd
      ).length;

      days.push({
        label: DAY_LABELS[d.getDay()],
        count,
        dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }

    return days;
  }, [tasks]);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold mb-3">週間の達成</h3>
      <div className="flex items-end gap-2 h-24" role="img" aria-label="過去7日間の完了タスク数">
        {data.map((d, i) => {
          const heightPct = (d.count / maxCount) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="relative w-full flex justify-center group">
                <div
                  className="w-full max-w-[32px] rounded-t-md transition-all duration-300"
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    minHeight: d.count > 0 ? "8px" : "2px",
                    background:
                      d.count > 0
                        ? `rgb(var(--primary) / ${0.3 + (d.count / maxCount) * 0.7})`
                        : "rgb(var(--border))",
                  }}
                  aria-hidden="true"
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 card px-2 py-1 text-xs whitespace-nowrap">
                  {d.dateStr} ({d.label}): {d.count}件完了
                </div>
              </div>
              <span className="text-[10px] muted">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
