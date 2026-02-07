/* hooks/useTabSync.ts */
"use client";

import { useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { listenTabSync } from "@/lib/tabSync";

/**
 * 他タブでの変更を検知してHYDRATEを再実行するhook
 * AppShell で1箇所だけ配置する
 */
export function useTabSync() {
  const { importTasks } = useTasks();

  useEffect(() => {
    if (typeof window === "undefined") return;
    return listenTabSync((json) => {
      importTasks(json);
    });
  }, [importTasks]);
}
