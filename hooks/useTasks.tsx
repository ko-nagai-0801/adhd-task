/* hooks/useTasks.tsx */
"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { loadTasksFromStorage, saveTasksToStorage } from "@/lib/storage";
import { initialTasksState, tasksReducer } from "@/lib/tasks";
import type { Task, TaskStatus } from "@/lib/types";

type TasksContextValue = {
  hydrated: boolean;
  tasks: Task[];
  addTask: (title: string) => void;
  move: (id: string, to: TaskStatus) => void;
  setNow: (id: string) => void;
  completeNow: () => void;
  reorderNext: (id: string, dir: "up" | "down") => void;
  restoreDiscarded: (id: string) => void;
  undoDoneToInbox: (id: string) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tasksReducer, initialTasksState);

  useEffect(() => {
    const tasks = loadTasksFromStorage();
    dispatch({ type: "HYDRATE", tasks: tasks ?? [] });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    saveTasksToStorage(state.tasks);
  }, [state.hydrated, state.tasks]);

  const api = useMemo<TasksContextValue>(() => {
    return {
      hydrated: state.hydrated,
      tasks: state.tasks,

      addTask(title) {
        dispatch({ type: "ADD_TASK", id: genId(), title, now: Date.now() });
      },

      move(id, to) {
        dispatch({ type: "MOVE", id, to, now: Date.now() });
      },

      setNow(id) {
        dispatch({ type: "SET_NOW", id, now: Date.now() });
      },

      completeNow() {
        dispatch({ type: "COMPLETE_NOW", now: Date.now() });
      },

      reorderNext(id, dir) {
        dispatch({ type: "REORDER_TODAY_NEXT", id, dir, now: Date.now() });
      },

      restoreDiscarded(id) {
        dispatch({ type: "RESTORE_FROM_DISCARDED", id, now: Date.now() });
      },

      undoDoneToInbox(id) {
        dispatch({ type: "UNDO_DONE_TO_INBOX", id, now: Date.now() });
      },
    };
  }, [state.hydrated, state.tasks]);

  return <TasksContext.Provider value={api}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
