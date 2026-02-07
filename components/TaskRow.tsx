/* components/TaskRow.tsx */
"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import PriorityBadge from "@/components/PriorityBadge";
import RecurrenceBadge from "@/components/RecurrenceBadge";
import TaskDetailModal from "@/components/TaskDetailModal";

type TaskRowProps = {
  task: Task;
  actions: React.ReactNode;
};

export default function TaskRow({ task, actions }: TaskRowProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div className="card p-3 flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
          aria-label={`「${task.title}」の詳細を開く`}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <PriorityBadge priority={task.priority} />
            <span className="text-sm font-medium break-words">{task.title}</span>
            <RecurrenceBadge recurrence={task.recurrence} />
            {task.estimatedMinutes && (
              <span className="text-[11px] muted">{task.estimatedMinutes}分</span>
            )}
          </div>
          {task.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-1.5 py-0.5 text-[10px] rounded-md bg-gray-200 dark:bg-gray-700 muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </button>
        <div className="flex gap-2 shrink-0 flex-wrap justify-end">{actions}</div>
      </div>

      {showDetail && (
        <TaskDetailModal task={task} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
