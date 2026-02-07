/* components/DataManager.tsx */
"use client";

import { useRef, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { exportTasksToJSON } from "@/lib/storage";

export default function DataManager() {
  const { importTasks } = useTasks();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function handleExport() {
    const json = exportTasksToJSON();
    if (!json) {
      setMsg({ text: "エクスポートするデータがありません", ok: false });
      return;
    }

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adhd-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ text: "エクスポートしました", ok: true });
  }

  function handleImport() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const ok = importTasks(text);
      setMsg(
        ok
          ? { text: "インポートしました（データを上書きしました）", ok: true }
          : { text: "ファイル形式が正しくありません", ok: false }
      );
    };
    reader.readAsText(file);

    // 同じファイルを再選択できるようリセット
    e.target.value = "";
  }

  return (
    <section className="card p-4">
      <h2 className="text-base font-semibold">データ管理</h2>
      <p className="text-sm muted mt-1">
        バックアップや別端末への移行にご利用ください。
      </p>

      <div className="mt-3 flex gap-2 flex-wrap">
        <button onClick={handleExport} className="btn-outline px-3 py-2 text-xs">
          エクスポート（JSON）
        </button>
        <button onClick={handleImport} className="btn-outline px-3 py-2 text-xs">
          インポート（JSON）
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {msg && (
        <p className={`text-xs mt-2 ${msg.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
