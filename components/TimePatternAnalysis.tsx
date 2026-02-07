/* components/TimePatternAnalysis.tsx */
"use client";

import { useMemo } from "react";
import type { Task } from "@/lib/types";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const TIME_SLOTS = [
  { label: "朝", key: "morning", range: [5, 12] },
  { label: "昼", key: "afternoon", range: [12, 17] },
  { label: "夕", key: "evening", range: [17, 21] },
  { label: "夜", key: "night", range: [21, 29] }, // 29 = wraps 0-5
] as const;

function getSlotIndex(hour: number): number {
  if (hour >= 5 && hour < 12) return 0;
  if (hour >= 12 && hour < 17) return 1;
  if (hour >= 17 && hour < 21) return 2;
  return 3; // 21-4
}

export default function TimePatternAnalysis({ tasks }: { tasks: Task[] }) {
  const { grid, maxCount, bestSlot } = useMemo(() => {
    // grid[dayOfWeek][slotIndex] = count
    const g: number[][] = Array.from({ length: 7 }, () => [0, 0, 0, 0]);
    let max = 0;

    const doneTasks = tasks.filter(
      (t) =>
        t.status === "done" &&
        t.completedAtHour !== undefined &&
        t.dayOfWeek !== undefined
    );

    for (const t of doneTasks) {
      const slot = getSlotIndex(t.completedAtHour!);
      g[t.dayOfWeek!][slot]++;
      if (g[t.dayOfWeek!][slot] > max) max = g[t.dayOfWeek!][slot];
    }

    // Find best time slot overall
    const slotTotals = [0, 0, 0, 0];
    for (let d = 0; d < 7; d++) {
      for (let s = 0; s < 4; s++) {
        slotTotals[s] += g[d][s];
      }
    }
    const bestIdx = slotTotals.indexOf(Math.max(...slotTotals));
    const best =
      slotTotals[bestIdx] > 0 ? TIME_SLOTS[bestIdx].label : null;

    return { grid: g, maxCount: max, bestSlot: best };
  }, [tasks]);

  const message = bestSlot
    ? `あなたは${bestSlot}が得意みたいです`
    : "データが溜まると傾向が見えてきます";

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold mb-1">時間帯パターン</h3>
      <p className="text-xs muted mb-3">{message}</p>

      {/* Header */}
      <div className="grid grid-cols-[auto_repeat(4,1fr)] gap-1 text-[10px]">
        <div />
        {TIME_SLOTS.map((s) => (
          <div key={s.key} className="text-center muted">
            {s.label}
          </div>
        ))}

        {/* Rows */}
        {DAY_LABELS.map((dayLabel, dayIdx) => (
          <div key={dayIdx} className="contents">
            <div className="muted text-right pr-1 flex items-center justify-end">
              {dayLabel}
            </div>
            {TIME_SLOTS.map((_, slotIdx) => {
              const count = grid[dayIdx][slotIdx];
              const intensity =
                maxCount > 0 ? count / maxCount : 0;
              return (
                <div
                  key={slotIdx}
                  className="aspect-square rounded-sm flex items-center justify-center text-[9px]"
                  style={{
                    background:
                      count > 0
                        ? `rgb(var(--primary) / ${0.15 + intensity * 0.65})`
                        : "rgb(var(--border) / 0.4)",
                    color:
                      intensity > 0.5
                        ? "rgb(var(--primary-foreground))"
                        : "rgb(var(--muted))",
                  }}
                  title={`${dayLabel} ${TIME_SLOTS[slotIdx].label}: ${count}件`}
                  aria-label={`${dayLabel} ${TIME_SLOTS[slotIdx].label}: ${count}件完了`}
                >
                  {count > 0 ? count : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
