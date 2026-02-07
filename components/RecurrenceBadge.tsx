/* components/RecurrenceBadge.tsx */
"use client";

import type { Recurrence } from "@/lib/types";

const DAYS = ["日", "月", "火", "水", "木", "金", "土"];

function label(r: Recurrence): string {
  switch (r.type) {
    case "daily":
      return "毎日";
    case "weekly":
      return `毎週${r.dayOfWeek != null ? DAYS[r.dayOfWeek] : ""}`;
    case "monthly":
      return `毎月${r.dayOfMonth != null ? `${r.dayOfMonth}日` : ""}`;
  }
}

export default function RecurrenceBadge({ recurrence }: { recurrence?: Recurrence }) {
  if (!recurrence) return null;

  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] muted leading-none"
      title={`定期: ${label(recurrence)}`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11v-1a4 4 0 014-4h14" />
        <path d="M7 22l-4-4 4-4" />
        <path d="M21 13v1a4 4 0 01-4 4H3" />
      </svg>
      {label(recurrence)}
    </span>
  );
}
