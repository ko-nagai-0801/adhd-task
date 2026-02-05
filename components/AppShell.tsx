/* components/AppShell.tsx */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import QuickAdd from "@/components/QuickAdd";
import NowBar from "@/components/NowBar";
import { useTasks } from "@/hooks/useTasks";

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { tasks, hydrated } = useTasks();

  const inboxCount = tasks.filter((t) => t.status === "inbox").length;
  const todayCount = tasks.filter(
    (t) => t.status === "today_now" || t.status === "today_next"
  ).length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const navItem = (href: string, label: string, badge?: number) => (
    <Link
      href={href}
      className={cx(
        "px-3 py-2 rounded-xl border text-sm",
        pathname === href
          ? "bg-black text-white border-black"
          : "bg-white border-slate-200"
      )}
    >
      {label}
      {typeof badge === "number" && hydrated ? (
        <span
          className={cx(
            "ml-2 text-xs",
            pathname === href ? "text-white/80" : "text-slate-500"
          )}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <div className="container">
      <header className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">ADHD Task</h1>
            <p className="text-sm muted">ログイン不要 / 端末内保存（localStorage）</p>
          </div>

          <nav className="flex gap-2 flex-wrap">
            {navItem("/app", "Today", todayCount)}
            {navItem("/inbox", "Inbox", inboxCount)}
            {navItem("/history", "History", doneCount)}
          </nav>
        </div>

        {/* ✅ /app では TodayBoard 側に Now があるので重複表示しない */}
        {pathname !== "/app" ? (
          <div className="mt-4">
            <NowBar />
          </div>
        ) : null}

        <div className="mt-4">
          <QuickAdd />
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-10 pb-6 text-xs muted">
        ※ データはこの端末のブラウザに保存されます（ログインなし）。ブラウザのデータ削除で消える可能性があります。
      </footer>
    </div>
  );
}
