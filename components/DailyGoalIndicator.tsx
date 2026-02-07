/* components/DailyGoalIndicator.tsx */
"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function DailyGoalIndicator() {
  const { tasks, settings } = useTasks();

  const { todayDone, goal } = useMemo(() => {
    const now = new Date();
    const todayCount = tasks.filter(
      (t) => t.status === "done" && t.doneAt && isSameDay(new Date(t.doneAt), now)
    ).length;

    let goalVal = settings.dailyGoal;

    if (goalVal === 0) {
      // Auto-calculate from 7-day average
      const sevenDaysAgo = startOfDay(Date.now()) - 6 * 24 * 60 * 60 * 1000;
      const recent = tasks.filter(
        (t) => t.status === "done" && t.doneAt && t.doneAt >= sevenDaysAgo
      ).length;
      goalVal = Math.max(1, Math.round(recent / 7));
    }

    return { todayDone: todayCount, goal: goalVal };
  }, [tasks, settings.dailyGoal]);

  const pct = Math.min((todayDone / goal) * 100, 100);
  const achieved = todayDone >= goal;

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium">
          今日のこころ目安: {goal}個
        </span>
        <span className="text-xs muted">
          {todayDone} / {goal}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: "rgb(var(--border))" }}
        role="progressbar"
        aria-valuenow={todayDone}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-label={`今日の達成: ${todayDone}件 / 目安${goal}件`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: achieved
              ? "rgb(34 197 94)"
              : "rgb(var(--primary) / 0.6)",
          }}
        />
      </div>

      <p className="text-xs muted mt-2">
        {achieved
          ? "いい調子です！"
          : todayDone > 0
            ? "少しずつ進んでます"
            : "無理しなくてOK"}
      </p>
    </div>
  );
}
