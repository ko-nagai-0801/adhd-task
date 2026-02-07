/* components/DataManager.tsx */
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";
import { exportTasksToJSON } from "@/lib/storage";
import {
  createBackup,
  listBackups,
  restoreFromBackup,
  autoBackupIfNeeded,
  getLastBackupTime,
  type BackupEntry,
} from "@/lib/indexedDBBackup";
import AITaskBreaker from "@/components/AITaskBreaker";

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DataManager() {
  const { importTasks, settings } = useTasks();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // バックアップ関連
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  const refreshBackups = useCallback(async () => {
    const list = await listBackups();
    setBackups(list);
    setLastBackup(getLastBackupTime());
  }, []);

  useEffect(() => {
    autoBackupIfNeeded().then(() => refreshBackups());
  }, [refreshBackups]);

  async function handleManualBackup() {
    setBackupLoading(true);
    try {
      await createBackup();
      await refreshBackups();
      setMsg({ text: "バックアップを作成しました", ok: true });
    } catch {
      setMsg({ text: "バックアップの作成に失敗しました", ok: false });
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleRestore(backupId: string) {
    if (!window.confirm("このバックアップから復元しますか？現在のデータは上書きされます。")) {
      return;
    }
    try {
      const ok = await restoreFromBackup(backupId);
      if (ok) {
        setMsg({ text: "復元しました。ページを再読み込みします…", ok: true });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMsg({ text: "バックアップが見つかりません", ok: false });
      }
    } catch {
      setMsg({ text: "復元に失敗しました", ok: false });
    }
  }

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
    <div className="flex flex-col gap-4">
      {/* データ管理 */}
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

      {/* 自動バックアップ */}
      <section className="card p-4">
        <h2 className="text-base font-semibold">自動バックアップ</h2>
        <p className="text-sm muted mt-1">
          1日1回自動でバックアップされます（最大7世代保持）。
        </p>

        <div className="mt-2 text-sm">
          {lastBackup ? (
            <span>最後のバックアップ: {formatTimeAgo(lastBackup)}</span>
          ) : (
            <span className="muted">バックアップはまだありません</span>
          )}
        </div>

        <div className="mt-3">
          <button
            onClick={handleManualBackup}
            disabled={backupLoading}
            className="btn-outline px-3 py-2 text-xs"
          >
            {backupLoading ? "作成中…" : "手動バックアップ"}
          </button>
        </div>

        {backups.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium mb-1">バックアップ一覧</p>
            <ul className="space-y-1">
              {backups.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <span className="muted">{formatDate(b.createdAt)}</span>
                  <button
                    onClick={() => handleRestore(b.id)}
                    className="btn-outline px-2 py-1 text-xs"
                  >
                    復元
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* AIタスク分解 */}
      {settings.enableAI && <AITaskBreaker />}
    </div>
  );
}
