/* lib/tasks.ts */
import type { Task, TaskStatus } from "@/lib/types";

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
  | { type: "UNDO_DONE_TO_INBOX"; id: string; now: number };

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

export function tasksReducer(state: TasksState, action: TasksAction): TasksState {
  switch (action.type) {
    case "HYDRATE": {
      const now = Date.now();
      const normalized = promoteNextToNowIfEmpty(
        ensureSingleNow(action.tasks, now),
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
      };

      return { ...state, tasks: [...state.tasks, next] };
    }

    case "MOVE": {
      const tasks: Task[] = state.tasks.map((t): Task => {
        if (t.id !== action.id) return t;

        const to = action.to;
        const order =
          to === t.status ? t.order : maxOrder(state.tasks, to) + 1;

        const base: Task = {
          ...t,
          status: to,
          updatedAt: action.now,
          doneAt: to === "done" ? action.now : undefined,
          order,
        };

        if (to === "today_now") base.order = 0;

        return base;
      });

      const singleNow = ensureSingleNow(tasks, action.now);
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
          };
        }
        return t;
      });

      return { ...state, tasks };
    }

    case "COMPLETE_NOW": {
      const nowTask = state.tasks.find((t) => t.status === "today_now");
      if (!nowTask) return state;

      const tasks: Task[] = state.tasks.map((t): Task => {
        if (t.id !== nowTask.id) return t;
        return {
          ...t,
          status: "done",
          updatedAt: action.now,
          doneAt: action.now,
        };
      });

      const promoted = promoteNextToNowIfEmpty(tasks, action.now);
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

    default:
      return state;
  }
}
