/* components/PriorityBadge.tsx */
"use client";

import type { TaskPriority } from "@/lib/types";

export default function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === "normal") return null;

  if (priority === "high") {
    return (
      <span
        className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0"
        title="優先度：高"
        aria-label="優先度：高"
      />
    );
  }

  return (
    <span
      className="inline-block w-2 h-2 rounded-full bg-gray-400 shrink-0"
      title="優先度：低"
      aria-label="優先度：低"
    />
  );
}
