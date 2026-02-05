/* app/layout.tsx */
import type { Metadata } from "next";
import "./globals.css";
import "@/styles/theme.css";
import { TasksProvider } from "@/hooks/useTasks";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ADHDタスク",
  description: "ログイン不要のADHD向けタスク管理（ローカル保存）",
};

const themeInitScript = `
(function () {
  try {
    var key = "adhd_task_theme_v1";
    var theme = localStorage.getItem(key) || "system";
    var isDark = false;

    if (theme === "dark") isDark = true;
    else if (theme === "light") isDark = false;
    else isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    var root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    root.dataset.theme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <TasksProvider>
          <AppShell>{children}</AppShell>
        </TasksProvider>
      </body>
    </html>
  );
}
