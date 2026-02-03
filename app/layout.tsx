/* app/layout.tsx */
import type { Metadata } from "next";
import "./globals.css";
import "@/styles/theme.css";
import { TasksProvider } from "@/hooks/useTasks";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ADHD Task",
  description: "ログイン不要のADHD向けタスク管理（ローカル保存）",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <TasksProvider>
          <AppShell>{children}</AppShell>
        </TasksProvider>
      </body>
    </html>
  );
}
