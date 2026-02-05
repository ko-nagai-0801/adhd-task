/* components/AppShell.tsx */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import QuickAdd from "@/components/QuickAdd";
import NowBar from "@/components/NowBar";
import ThemeToggle from "@/components/ThemeToggle";
import { useTasks } from "@/hooks/useTasks";

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { tasks, hydrated } = useTasks();

  const memoCount = tasks.filter((t) => t.status === "inbox").length;
  const todayCount = tasks.filter(
    (t) => t.status === "today_now" || t.status === "today_next"
  ).length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const navItem = (href: string, label: string, badge?: number) => (
    <Link
      href={href}
      className={cx(
        "pill px-3 py-2 text-sm",
        pathname === href && "pill--active"
      )}
    >
      {label}
      {typeof badge === "number" && hydrated ? (
        <span className="badge">{badge}</span>
      ) : null}
    </Link>
  );

  return (
    <div className="container">
      <header className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">ADHDタスク</h1>
            <p className="text-sm muted">
              ログイン不要 / 端末内保存（localStorage）
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <nav className="flex gap-2 flex-wrap">
              {navItem("/app", "今日", todayCount)}
              {navItem("/inbox", "メモ箱", memoCount)}
              {navItem("/history", "達成", doneCount)}
            </nav>
            <ThemeToggle />
          </div>
        </div>

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
