/* lib/tasks.ts */
import type { Recurrence, Task, TaskPriority, TaskStatus } from "@/lib/types";

export type TasksState = {
  hydrated: boolean;
  tasks: Task[];
};

export type TasksAction =
  | { type: "HYDRATE"; tasks: Task[] }
  | { type: "ADD_TASK"; id: string; title: string; now: number }
  | { type: "MOVE"; id: string; to: TaskStatus; now: number }
  | { type: "SET_NOW"; id: string; now: number }
  | { type: "COMPLETE_NOW"; now: number }
  | { type: "REORDER_TODAY_NEXT"; id: string; dir: "up" | "down"; now: number }
  | { type: "RESTORE_FROM_DISCARDED"; id: string; now: number }
  | { type: "UNDO_DONE_TO_INBOX"; id: string; now: number }
  | { type: "IMPORT_TASKS"; tasks: Task[] }
  // Phase1 新アクション
  | { type: "SET_DESCRIPTION"; id: string; description: string; now: number }
  | { type: "SET_PRIORITY"; id: string; priority: TaskPriority; now: number }
  | { type: "ADD_TAG"; id: string; tag: string; now: number }
  | { type: "REMOVE_TAG"; id: string; tag: string; now: number }
  | { type: "SET_ESTIMATE"; id: string; minutes: number; now: number }
  | { type: "ARCHIVE_TASK"; id: string; now: number }
  | { type: "RESTORE_ARCHIVED"; id: string; now: number }
  | { type: "SET_LATER_DUE"; id: string; date: number; now: number }
  | { type: "SET_RECURRENCE"; id: string; recurrence: Recurrence | undefined; now: number };

export const initialTasksState: TasksState = {
  hydrated: false,
  tasks: [],
};

function maxOrder(tasks: Task[], status: TaskStatus): number {
  const list = tasks.filter((t) => t.status === status);
  return list.length ? Math.max(...list.map((t) => t.order)) : 0;
}

function ensureSingleNow(tasks: Task[], now: number): Task[] {
  const nowTasks = tasks
    .filter((t) => t.status === "today_now")
    .sort((a, b) => a.updatedAt - b.updatedAt);

  if (nowTasks.length <= 1) return tasks;

  // 古いものをNextへ落とす（最後に更新されたNowを残す）
  const keepId = nowTasks[nowTasks.length - 1]!.id;

  return tasks.map((t): Task => {
    if (t.status !== "today_now") return t;
    if (t.id === keepId) return t;

    return {
      ...t,
      status: "today_next",
      updatedAt: now,
      order: maxOrder(tasks, "today_next") + 1,
      doneAt: undefined,
    };
  });
}

function promoteNextToNowIfEmpty(tasks: Task[], now: number): Task[] {
  const hasNow = tasks.some((t) => t.status === "today_now");
  if (hasNow) return tasks;

  const next = tasks
    .filter((t) => t.status === "today_next")
    .sort((a, b) => a.order - b.order)[0];

  if (!next) return tasks;

  return tasks.map((t): Task =>
    t.id === next.id ? { ...t, status: "today_now", updatedAt: now, order: 0 } : t
  );
}

/** タスクにPhase1デフォルト値を保証する */
function ensureDefaults(t: Task): Task {
  return {
    ...t,
    priority: t.priority ?? "normal",
    tags: t.tags ?? [],
  };
}

/** 定期タスクの次回タスクを生成 */
function generateNextRecurringTask(task: Task, now: number): Task | null {
  if (!task.recurrence) return null;

  const newId = `rec_${now}_${Math.random().toString(16).slice(2)}`;
  return {
    ...task,
    id: newId,
    status: "inbox",
    createdAt: now,
    updatedAt: now,
    doneAt: undefined,
    startedAt: undefined,
    actualMinutes: undefined,
    completedAtHour: undefined,
    dayOfWeek: undefined,
    archivedAt: undefined,
    order: 0,
  };
}

/** MOVE/COMPLETE_NOW時のdone遷移処理 */
function applyDoneFields(task: Task, now: number): Task {
  const d = new Date(now);
  const actualMinutes =
    task.startedAt != null ? Math.round((now - task.startedAt) / 60000) : undefined;

  return {
    ...task,
    status: "done" as const,
    updatedAt: now,
    doneAt: now,
    actualMinutes: actualMinutes ?? task.actualMinutes,
    completedAtHour: d.getHours(),
    dayOfWeek: d.getDay(),
  };
}

export function tasksReducer(state: TasksState, action: TasksAction): TasksState {
  switch (action.type) {
    case "HYDRATE": {
      const now = Date.now();
      const normalized = promoteNextToNowIfEmpty(
        ensureSingleNow(action.tasks.map(ensureDefaults), now),
        now
      );
      return { hydrated: true, tasks: normalized };
    }

    case "ADD_TASK": {
      const title = action.title.trim();
      if (!title) return state;

      const order = maxOrder(state.tasks, "inbox") + 1;
      const next: Task = {
        id: action.id,
        title,
        status: "inbox",
        createdAt: action.now,
        updatedAt: action.now,
        order,
        priority: "normal",
        tags: [],
      };

      return { ...state, tasks: [...state.tasks, next] };
    }

    case "MOVE": {
      let newRecurring: Task | null = null;

      const tasks: Task[] = state.tasks.map((t): Task => {
        if (t.id !== action.id) return t;

        const to = action.to;
        const order =
          to === t.status ? t.order : maxOrder(state.tasks, to) + 1;

        // done遷移: actualMinutes, completedAtHour, dayOfWeekを自動設定
        if (to === "done") {
          const doneTask = applyDoneFields({ ...t, order }, action.now);
          // 定期タスクなら次回生成
          if (t.recurrence) {
            newRecurring = generateNextRecurringTask(t, action.now);
          }
          return doneTask;
        }

        const base: Task = {
          ...t,
          status: to,
          updatedAt: action.now,
          doneAt: undefined,
          order,
        };

        if (to === "today_now") {
          base.order = 0;
          base.startedAt = action.now;
        }

        return base;
      });

      const withRecurring = newRecurring ? [...tasks, newRecurring] : tasks;
      const singleNow = ensureSingleNow(withRecurring, action.now);
      const promoted = promoteNextToNowIfEmpty(singleNow, action.now);
      return { ...state, tasks: promoted };
    }

    case "SET_NOW": {
      const target = state.tasks.find((t) => t.id === action.id);
      if (!target) return state;

      const tasks: Task[] = state.tasks.map((t): Task => {
        if (t.status === "today_now" && t.id !== action.id) {
          return {
            ...t,
            status: "today_next",
            updatedAt: action.now,
            order: maxOrder(state.tasks, "today_next") + 1,
            doneAt: undefined,
          };
        }
        if (t.id === action.id) {
          return {
            ...t,
            status: "today_now",
            updatedAt: action.now,
            order: 0,
            doneAt: undefined,
            startedAt: action.now,
          };
        }
        return t;
      });

      return { ...state, tasks };
    }

    case "COMPLETE_NOW": {
      const nowTask = state.tasks.find((t) => t.status === "today_now");
      if (!nowTask) return state;

      let newRecurring: Task | null = null;

      const tasks: Task[] = state.tasks.map((t): Task => {
        if (t.id !== nowTask.id) return t;

        const doneTask = applyDoneFields(t, action.now);

        if (t.recurrence) {
          newRecurring = generateNextRecurringTask(t, action.now);
        }

        return doneTask;
      });

      const withRecurring = newRecurring ? [...tasks, newRecurring] : tasks;
      const promoted = promoteNextToNowIfEmpty(withRecurring, action.now);
      return { ...state, tasks: promoted };
    }

    case "REORDER_TODAY_NEXT": {
      const list = state.tasks
        .filter((t) => t.status === "today_next")
        .sort((a, b) => a.order - b.order);

      const idx = list.findIndex((t) => t.id === action.id);
      if (idx === -1) return state;

      const swapWith = action.dir === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= list.length) return state;

      const a = list[idx]!;
      const b = list[swapWith]!;

      const tasks: Task[] = state.tasks.map((t): Task => {
        if (t.id === a.id) return { ...t, order: b.order, updatedAt: action.now };
        if (t.id === b.id) return { ...t, order: a.order, updatedAt: action.now };
        return t;
      });

      return { ...state, tasks };
    }

    case "RESTORE_FROM_DISCARDED": {
      const tasks: Task[] = state.tasks.map((t): Task => {
        if (t.id !== action.id) return t;
        return {
          ...t,
          status: "inbox",
          updatedAt: action.now,
          order: maxOrder(state.tasks, "inbox") + 1,
          doneAt: undefined,
        };
      });
      return { ...state, tasks };
    }

    case "UNDO_DONE_TO_INBOX": {
      const tasks: Task[] = state.tasks.map((t): Task => {
        if (t.id !== action.id) return t;
        return {
          ...t,
          status: "inbox",
          updatedAt: action.now,
          doneAt: undefined,
          order: maxOrder(state.tasks, "inbox") + 1,
        };
      });
      return { ...state, tasks };
    }

    case "IMPORT_TASKS": {
      const now = Date.now();
      const normalized = promoteNextToNowIfEmpty(
        ensureSingleNow(action.tasks.map(ensureDefaults), now),
        now
      );
      return { hydrated: true, tasks: normalized };
    }

    /* ── Phase1 新アクション ── */

    case "SET_DESCRIPTION": {
      const tasks = state.tasks.map((t): Task =>
        t.id === action.id ? { ...t, description: action.description, updatedAt: action.now } : t
      );
      return { ...state, tasks };
    }

    case "SET_PRIORITY": {
      const tasks = state.tasks.map((t): Task =>
        t.id === action.id ? { ...t, priority: action.priority, updatedAt: action.now } : t
      );
      return { ...state, tasks };
    }

    case "ADD_TAG": {
      const tasks = state.tasks.map((t): Task => {
        if (t.id !== action.id) return t;
        if (t.tags.includes(action.tag)) return t;
        return { ...t, tags: [...t.tags, action.tag], updatedAt: action.now };
      });
      return { ...state, tasks };
    }

    case "REMOVE_TAG": {
      const tasks = state.tasks.map((t): Task => {
        if (t.id !== action.id) return t;
        return { ...t, tags: t.tags.filter((tag) => tag !== action.tag), updatedAt: action.now };
      });
      return { ...state, tasks };
    }

    case "SET_ESTIMATE": {
      const tasks = state.tasks.map((t): Task =>
        t.id === action.id ? { ...t, estimatedMinutes: action.minutes, updatedAt: action.now } : t
      );
      return { ...state, tasks };
    }

    case "ARCHIVE_TASK": {
      const tasks = state.tasks.map((t): Task =>
        t.id === action.id ? { ...t, archivedAt: action.now, updatedAt: action.now } : t
      );
      return { ...state, tasks };
    }

    case "RESTORE_ARCHIVED": {
      const tasks = state.tasks.map((t): Task =>
        t.id === action.id ? { ...t, archivedAt: undefined, updatedAt: action.now } : t
      );
      return { ...state, tasks };
    }

    case "SET_LATER_DUE": {
      const tasks = state.tasks.map((t): Task =>
        t.id === action.id ? { ...t, laterDueDate: action.date, updatedAt: action.now } : t
      );
      return { ...state, tasks };
    }

    case "SET_RECURRENCE": {
      const tasks = state.tasks.map((t): Task =>
        t.id === action.id ? { ...t, recurrence: action.recurrence, updatedAt: action.now } : t
      );
      return { ...state, tasks };
    }

    default:
      return state;
  }
}
