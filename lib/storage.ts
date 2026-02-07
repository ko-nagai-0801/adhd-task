/* lib/storage.ts */
import type { AppSettings, PersistedStateV1, PersistedStateV2, Task } from "@/lib/types";

const STORAGE_KEY_V1 = "adhd_task_app_v1";
const STORAGE_KEY_V2 = "adhd_task_app_v2";

export const defaultSettings: AppSettings = {
  pomodoroMinutes: 25,
  dailyGoal: 0,
  enableAI: false,
};

/** 既存タスクにPhase1新フィールドのデフォルト値を付与 */
function migrateTask(t: Record<string, unknown>): Task {
  return {
    id: t.id as string,
    title: t.title as string,
    status: t.status as Task["status"],
    createdAt: t.createdAt as number,
    updatedAt: t.updatedAt as number,
    doneAt: t.doneAt as number | undefined,
    order: t.order as number,
    description: (t.description as string | undefined) ?? undefined,
    estimatedMinutes: (t.estimatedMinutes as number | undefined) ?? undefined,
    actualMinutes: (t.actualMinutes as number | undefined) ?? undefined,
    startedAt: (t.startedAt as number | undefined) ?? undefined,
    priority: (t.priority as Task["priority"]) ?? "normal",
    tags: Array.isArray(t.tags) ? (t.tags as string[]) : [],
    recurrence: (t.recurrence as Task["recurrence"]) ?? undefined,
    archivedAt: (t.archivedAt as number | undefined) ?? undefined,
    laterDueDate: (t.laterDueDate as number | undefined) ?? undefined,
    context: (t.context as Task["context"]) ?? undefined,
    completedAtHour: (t.completedAtHour as number | undefined) ?? undefined,
    dayOfWeek: (t.dayOfWeek as number | undefined) ?? undefined,
  };
}

export function migrateV1toV2(data: PersistedStateV1): PersistedStateV2 {
  return {
    version: 2,
    updatedAt: data.updatedAt,
    tasks: data.tasks.map((t) => migrateTask(t as unknown as Record<string, unknown>)),
    settings: { ...defaultSettings },
  };
}

export function loadTasksFromStorage(): Task[] | null {
  if (typeof window === "undefined") return null;

  try {
    // まずv2を読む
    const rawV2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as PersistedStateV2;
      if (parsed && parsed.version === 2 && Array.isArray(parsed.tasks)) {
        return parsed.tasks
          .filter((t) => t && typeof t.id === "string" && typeof t.title === "string")
          .map((t) => migrateTask(t as unknown as Record<string, unknown>));
      }
    }

    // v2がなければv1から自動移行
    const rawV1 = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!rawV1) return null;

    const parsedV1 = JSON.parse(rawV1) as PersistedStateV1;
    if (!parsedV1 || parsedV1.version !== 1 || !Array.isArray(parsedV1.tasks)) return null;

    const validTasks = parsedV1.tasks.filter(
      (t) => t && typeof t.id === "string" && typeof t.title === "string"
    );
    const v2Data = migrateV1toV2({ ...parsedV1, tasks: validTasks });

    // v2に保存し、v1はそのまま残す（ロールバック用）
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(v2Data));

    return v2Data.tasks;
  } catch {
    return null;
  }
}

export function saveTasksToStorage(tasks: Task[]) {
  if (typeof window === "undefined") return;

  const settings = loadSettings();
  const payload: PersistedStateV2 = {
    version: 2,
    updatedAt: Date.now(),
    tasks,
    settings,
  };

  window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
}

export function clearStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY_V1);
  window.localStorage.removeItem(STORAGE_KEY_V2);
}

/* ── settings ── */

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return { ...defaultSettings };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V2);
    if (!raw) return { ...defaultSettings };

    const parsed = JSON.parse(raw) as PersistedStateV2;
    if (parsed && parsed.version === 2 && parsed.settings) {
      return {
        pomodoroMinutes: parsed.settings.pomodoroMinutes ?? defaultSettings.pomodoroMinutes,
        dailyGoal: parsed.settings.dailyGoal ?? defaultSettings.dailyGoal,
        enableAI: parsed.settings.enableAI ?? defaultSettings.enableAI,
      };
    }
  } catch {
    // fall through
  }
  return { ...defaultSettings };
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedStateV2;
      if (parsed && parsed.version === 2) {
        parsed.settings = settings;
        window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(parsed));
        return;
      }
    }
    // v2がまだ存在しない場合、新規作成
    const payload: PersistedStateV2 = {
      version: 2,
      updatedAt: Date.now(),
      tasks: [],
      settings,
    };
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

/* ── export / import ── */

export function exportTasksToJSON(): string | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY_V2);
  if (raw) return raw;

  // v2がなければv1を返す
  const rawV1 = window.localStorage.getItem(STORAGE_KEY_V1);
  return rawV1 ?? null;
}

export function validateImportData(
  data: unknown
): data is PersistedStateV1 | PersistedStateV2 {
  if (typeof data !== "object" || data === null) return false;

  const d = data as Record<string, unknown>;
  if (d.version !== 1 && d.version !== 2) return false;
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

    // v1データの場合はマイグレーションしてからタスクを返す
    if (parsed.version === 1) {
      const v2 = migrateV1toV2(parsed as PersistedStateV1);
      return v2.tasks;
    }

    // v2データの場合、タスクにデフォルト値を付与して返す
    return (parsed as PersistedStateV2).tasks.map(
      (t) => migrateTask(t as unknown as Record<string, unknown>)
    );
  } catch {
    return null;
  }
}
