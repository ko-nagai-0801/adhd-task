/* lib/tabSync.ts */

const STORAGE_KEY_V2 = "adhd_task_app_v2";

type TabSyncCallback = (json: string) => void;

/**
 * 複数タブ間のlocalStorage同期
 * 他タブでの変更を検知してコールバックを呼ぶ
 */
export function listenTabSync(onSync: TabSyncCallback): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY_V2) return;
    if (!e.newValue) return;
    onSync(e.newValue);
  };

  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
