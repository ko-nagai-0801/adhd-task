/* components/NowBar.tsx */
"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import CelebrationFeedback from "@/components/CelebrationFeedback";
import AutoPromoteNotice from "@/components/AutoPromoteNotice";

export default function NowBar() {
  const { hydrated, tasks, completeNow, move } = useTasks();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const prevNowIdRef = useRef<string | null>(null);

  const nowTask = tasks.find((t) => t.status === "today_now");

  // Track auto-promote: after completing, if a new Now appeared from Next
  const handleComplete = useCallback(() => {
    const nextTasks = tasks.filter((t) => t.status === "today_next");
    const hadNext = nextTasks.length > 0;

    prevNowIdRef.current = nowTask?.id ?? null;
    completeNow();
    setShowCelebration(true);

    if (hadNext) {
      // Slight delay so promotion renders first
      setTimeout(() => setShowPromote(true), 300);
    }
  }, [tasks, nowTask, completeNow]);

  const onCelebrationDone = useCallback(() => setShowCelebration(false), []);
  const onPromoteDone = useCallback(() => setShowPromote(false), []);

  if (!hydrated) return null;
  if (!nowTask && !showCelebration) return null;

  return (
    <div className="card--focus p-4">
      <AutoPromoteNotice visible={showPromote} onDone={onPromoteDone} />
      <CelebrationFeedback visible={showCelebration} onDone={onCelebrationDone} />

      {nowTask ? (
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs muted">いまやる1個</div>
            <div className="text-base font-semibold break-words">{nowTask.title}</div>
            <div className="text-xs muted mt-1">迷ったら、まずこの1個だけ。</div>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={handleComplete} className="btn-primary px-4 py-2 text-sm" aria-label="現在のタスクを完了にする">
              完了
            </button>
            <button
              onClick={() => move(nowTask.id, "today_next")}
              className="btn-outline px-4 py-2 text-sm"
              aria-label="Nextリストに戻す"
            >
              次へ
            </button>
            <button
              onClick={() => move(nowTask.id, "inbox")}
              className="btn-outline px-4 py-2 text-sm"
              aria-label="メモ箱に戻す"
            >
              メモ箱へ
            </button>
            <Link href="/app" className="btn-outline px-4 py-2 text-sm" aria-label="今日のタスク一覧へ">
              今日へ
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
