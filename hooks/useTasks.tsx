/* hooks/useTasks.tsx */
"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  importTasksFromJSON,
  loadSettings,
  saveSettings as persistSettings,
  defaultSettings,
} from "@/lib/storage";
import { initialTasksState, tasksReducer } from "@/lib/tasks";
import type { AppSettings, Recurrence, Task, TaskPriority, TaskStatus } from "@/lib/types";

type TasksContextValue = {
  hydrated: boolean;
  tasks: Task[];
  settings: AppSettings;
  addTask: (title: string) => void;
  move: (id: string, to: TaskStatus) => void;
  setNow: (id: string) => void;
  completeNow: () => void;
  reorderNext: (id: string, dir: "up" | "down") => void;
  restoreDiscarded: (id: string) => void;
  undoDoneToInbox: (id: string) => void;
  importTasks: (json: string) => boolean;
  // Phase1 新ヘルパー
  setDescription: (id: string, desc: string) => void;
  setPriority: (id: string, priority: TaskPriority) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  setEstimate: (id: string, minutes: number) => void;
  archiveTask: (id: string) => void;
  restoreArchived: (id: string) => void;
  setLaterDue: (id: string, date: number) => void;
  setRecurrence: (id: string, recurrence: Recurrence | undefined) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
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
  const [settings, setSettings] = useState<AppSettings>(() => ({ ...defaultSettings }));

  useEffect(() => {
    const tasks = loadTasksFromStorage();
    dispatch({ type: "HYDRATE", tasks: tasks ?? [] });
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    saveTasksToStorage(state.tasks);
  }, [state.hydrated, state.tasks]);

  const api = useMemo<TasksContextValue>(() => {
    return {
      hydrated: state.hydrated,
      tasks: state.tasks,
      settings,

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

      importTasks(json: string): boolean {
        const tasks = importTasksFromJSON(json);
        if (!tasks) return false;
        dispatch({ type: "IMPORT_TASKS", tasks });
        return true;
      },

      // Phase1 新ヘルパー
      setDescription(id, desc) {
        dispatch({ type: "SET_DESCRIPTION", id, description: desc, now: Date.now() });
      },

      setPriority(id, priority) {
        dispatch({ type: "SET_PRIORITY", id, priority, now: Date.now() });
      },

      addTag(id, tag) {
        dispatch({ type: "ADD_TAG", id, tag, now: Date.now() });
      },

      removeTag(id, tag) {
        dispatch({ type: "REMOVE_TAG", id, tag, now: Date.now() });
      },

      setEstimate(id, minutes) {
        dispatch({ type: "SET_ESTIMATE", id, minutes, now: Date.now() });
      },

      archiveTask(id) {
        dispatch({ type: "ARCHIVE_TASK", id, now: Date.now() });
      },

      restoreArchived(id) {
        dispatch({ type: "RESTORE_ARCHIVED", id, now: Date.now() });
      },

      setLaterDue(id, date) {
        dispatch({ type: "SET_LATER_DUE", id, date, now: Date.now() });
      },

      setRecurrence(id, recurrence) {
        dispatch({ type: "SET_RECURRENCE", id, recurrence, now: Date.now() });
      },

      updateSettings(patch) {
        setSettings((prev) => {
          const next = { ...prev, ...patch };
          persistSettings(next);
          return next;
        });
      },
    };
  }, [state.hydrated, state.tasks, settings]);

  return <TasksContext.Provider value={api}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
