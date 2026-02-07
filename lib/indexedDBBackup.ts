/* lib/indexedDBBackup.ts */

const DB_NAME = "adhd-task-backup";
const STORE_NAME = "backups";
const DB_VERSION = 1;
const MAX_BACKUPS = 7;
const LAST_BACKUP_KEY = "adhd_task_last_backup";
const STORAGE_KEY_V2 = "adhd_task_app_v2";

export type BackupEntry = {
  id: string;
  createdAt: number;
  data: string;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** バックアップを作成 */
export async function createBackup(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY_V2);
  if (!raw) return null;

  const db = await openDB();
  const id = `backup_${Date.now()}`;
  const entry: BackupEntry = {
    id,
    createdAt: Date.now(),
    data: raw,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
    tx.oncomplete = async () => {
      window.localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
      await pruneOldBackups(db);
      db.close();
      resolve(id);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** 古いバックアップを削除（最大MAX_BACKUPS世代保持） */
async function pruneOldBackups(db: IDBDatabase): Promise<void> {
  const all = await getAllEntries(db);
  if (all.length <= MAX_BACKUPS) return;

  // 新しい順にソートして、古いものを削除
  all.sort((a, b) => b.createdAt - a.createdAt);
  const toDelete = all.slice(MAX_BACKUPS);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const entry of toDelete) {
      store.delete(entry.id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getAllEntries(db: IDBDatabase): Promise<BackupEntry[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as BackupEntry[]);
    req.onerror = () => reject(req.error);
  });
}

/** バックアップ一覧を取得（新しい順） */
export async function listBackups(): Promise<BackupEntry[]> {
  if (typeof window === "undefined") return [];

  const db = await openDB();
  const all = await getAllEntries(db);
  db.close();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

/** バックアップからの復元 */
export async function restoreFromBackup(backupId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(backupId);
    req.onsuccess = () => {
      db.close();
      const entry = req.result as BackupEntry | undefined;
      if (!entry) {
        resolve(false);
        return;
      }
      window.localStorage.setItem(STORAGE_KEY_V2, entry.data);
      resolve(true);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

/** 1日1回の自動バックアップ（必要なら実行） */
export async function autoBackupIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;

  const last = window.localStorage.getItem(LAST_BACKUP_KEY);
  if (last) {
    const elapsed = Date.now() - Number(last);
    const oneDay = 24 * 60 * 60 * 1000;
    if (elapsed < oneDay) return;
  }

  await createBackup();
}

/** 最後のバックアップ日時を取得 */
export function getLastBackupTime(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LAST_BACKUP_KEY);
  return raw ? Number(raw) : null;
}
