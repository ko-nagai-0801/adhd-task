/* lib/storage.ts */
import type { PersistedStateV1, Task } from "@/lib/types";

const STORAGE_KEY = "adhd_task_app_v1";

export function loadTasksFromStorage(): Task[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedStateV1;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.tasks)) return null;

    // 最低限の整合性チェック
    return parsed.tasks.filter((t) => t && typeof t.id === "string" && typeof t.title === "string");
  } catch {
    return null;
  }
}

export function saveTasksToStorage(tasks: Task[]) {
  if (typeof window === "undefined") return;

  const payload: PersistedStateV1 = {
    version: 1,
    updatedAt: Date.now(),
    tasks,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/* ── export / import ── */

export function exportTasksToJSON(): string | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return raw;
}

export function validateImportData(
  data: unknown
): data is PersistedStateV1 {
  if (typeof data !== "object" || data === null) return false;

  const d = data as Record<string, unknown>;
  if (d.version !== 1) return false;
  if (typeof d.updatedAt !== "number") return false;
  if (!Array.isArray(d.tasks)) return false;

  return d.tasks.every((t: unknown) => {
    if (typeof t !== "object" || t === null) return false;
    const task = t as Record<string, unknown>;
    return (
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.status === "string" &&
      typeof task.createdAt === "number" &&
      typeof task.updatedAt === "number" &&
      typeof task.order === "number"
    );
  });
}

export function importTasksFromJSON(json: string): Task[] | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!validateImportData(parsed)) return null;
    return parsed.tasks;
  } catch {
    return null;
  }
}
