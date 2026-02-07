/* components/InboxBoard.tsx */
"use client";

import { useCallback, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import UndoToast from "@/components/UndoToast";
import type { Task } from "@/lib/types";

function encouragement(count: number): string {
  if (count === 0) return "スッキリ！いい状態です";
  if (count <= 5) return "ここに置いて整理すれば大丈夫";
  if (count <= 15) return "多めですね。「あとで」に逃がすのも手です";
  return "一気に片付けなくてOK。1個ずつ選別しましょう";
}

function fmtDue(ts: number): string {
  return new Date(ts).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

function DueBadge({ task }: { task: Task }) {
  if (!task.laterDueDate) return null;
  const overdue = task.laterDueDate < Date.now();
  return (
    <span className={overdue ? "badge-due badge-due--overdue" : "badge-due"}>
      {overdue ? "期限切れ " : ""}
      {fmtDue(task.laterDueDate)}
    </span>
  );
}

function TaskRow({ task, actions }: { task: Task; actions: React.ReactNode }) {
  return (
    <div className="card p-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium break-words">
          {task.title}
          {task.laterDueDate ? (
            <span className="ml-2"><DueBadge task={task} /></span>
          ) : null}
        </div>
        <div className="text-xs muted mt-1">
          メモ箱に置いてOK。選別は「あとで」で十分です。
        </div>
      </div>
      <div className="flex gap-2 shrink-0 flex-wrap justify-end">{actions}</div>
    </div>
  );
}

export default function InboxBoard() {
  const { hydrated, tasks, move, setNow, restoreDiscarded } = useTasks();
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [undoTarget, setUndoTarget] = useState<string | null>(null);

  const handleDiscard = useCallback(
    (id: string) => {
      move(id, "discarded");
      setUndoTarget(id);
    },
    [move]
  );

  const handleUndo = useCallback(() => {
    if (undoTarget) {
      restoreDiscarded(undoTarget);
      setUndoTarget(null);
    }
  }, [undoTarget, restoreDiscarded]);

  const handleUndoClose = useCallback(() => setUndoTarget(null), []);

  if (!hydrated) return <div className="text-sm muted">読み込み中…</div>;

  const memo = tasks
    .filter((t) => t.status === "inbox")
    .sort((a, b) => a.order - b.order);

  const later = tasks
    .filter((t) => t.status === "later")
    .sort((a, b) => a.order - b.order);

  // Split later into overdue and normal
  const now = Date.now();
  const overdueLater = later.filter(
    (t) => t.laterDueDate && t.laterDueDate < now
  );
  const normalLater = later.filter(
    (t) => !t.laterDueDate || t.laterDueDate >= now
  );

  const discarded = tasks
    .filter((t) => t.status === "discarded")
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  const moveToToday = (id: string) => {
    const hasNow = tasks.some((t) => t.status === "today_now");
    if (hasNow) move(id, "today_next");
    else setNow(id);
  };

  const laterActions = (t: Task) => (
    <>
      <button
        onClick={() => moveToToday(t.id)}
        className="btn-primary px-3 py-2 text-xs"
        aria-label={`「${t.title}」を今日やる`}
      >
        今日やる
      </button>
      <button
        onClick={() => move(t.id, "inbox")}
        className="btn-outline px-3 py-2 text-xs"
        aria-label={`「${t.title}」をメモ箱へ`}
      >
        メモ箱へ
      </button>
      <button
        onClick={() => handleDiscard(t.id)}
        className="btn-outline px-3 py-2 text-xs"
        aria-label={`「${t.title}」をやらない`}
      >
        やらない
      </button>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-base font-semibold mb-1">メモ箱</h2>
        <p className="text-xs muted mb-2">{encouragement(memo.length)}</p>
        <div className="flex flex-col gap-2">
          {memo.length ? (
            memo.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                actions={
                  <>
                    <button
                      onClick={() => moveToToday(t.id)}
                      className="btn-primary px-3 py-2 text-xs"
                      aria-label={`「${t.title}」を今日やる`}
                    >
                      今日やる
                    </button>
                    <button
                      onClick={() => move(t.id, "later")}
                      className="btn-outline px-3 py-2 text-xs"
                      aria-label={`「${t.title}」をあとでやる`}
                    >
                      あとで
                    </button>
                    <button
                      onClick={() => handleDiscard(t.id)}
                      className="btn-outline px-3 py-2 text-xs"
                      aria-label={`「${t.title}」をやらない`}
                    >
                      やらない
                    </button>
                  </>
                }
              />
            ))
          ) : (
            <div className="card p-4 text-sm muted">
              メモ箱は空です。思いついたら上の入力で放り込めばOKです。
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">あとで</h2>
        <p className="text-xs muted mb-2">
          期間や心理的スペースが必要な時に。判断ミスではなく、優先度調整です。
        </p>

        {overdueLater.length > 0 && (
          <div className="mb-3">
            <h3 className="text-xs font-semibold mb-1" style={{ color: "rgb(220 38 38)" }}>
              期限切れ
            </h3>
            <div className="flex flex-col gap-2">
              {overdueLater.map((t) => (
                <TaskRow key={t.id} task={t} actions={laterActions(t)} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {normalLater.length ? (
            normalLater.map((t) => (
              <TaskRow key={t.id} task={t} actions={laterActions(t)} />
            ))
          ) : overdueLater.length === 0 ? (
            <div className="card p-4 text-sm muted">
              「あとで」に逃がすだけでも十分前進です。
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">やらない</h2>
          <button
            onClick={() => setShowDiscarded((v) => !v)}
            className="btn-outline px-3 py-2 text-xs"
            aria-label={showDiscarded ? "やらないリストを隠す" : "やらないリストを表示する"}
            aria-expanded={showDiscarded}
          >
            {showDiscarded ? "隠す" : `表示（${discarded.length}）`}
          </button>
        </div>

        {showDiscarded ? (
          <div className="mt-2 flex flex-col gap-2">
            {discarded.length ? (
              discarded.map((t) => (
                <div
                  key={t.id}
                  className="card p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium break-words">
                      {t.title}
                    </div>
                    <div className="text-xs muted mt-1">
                      復元できます（判断ミス対策）。
                    </div>
                  </div>
                  <button
                    onClick={() => restoreDiscarded(t.id)}
                    className="btn-primary px-3 py-2 text-xs"
                    aria-label={`「${t.title}」をメモ箱に戻す`}
                  >
                    メモ箱に戻す
                  </button>
                </div>
              ))
            ) : (
              <div className="card p-4 text-sm muted">ありません。</div>
            )}
          </div>
        ) : null}
      </section>

      <UndoToast
        visible={undoTarget !== null}
        onUndo={handleUndo}
        onClose={handleUndoClose}
      />
    </div>
  );
}
