/* lib/types.ts */
export type TaskStatus =
  | "inbox"
  | "later"
  | "discarded"
  | "today_now"
  | "today_next"
  | "done";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  doneAt?: number;
  order: number; // 同一ステータス内の並び
};

export type PersistedStateV1 = {
  version: 1;
  updatedAt: number;
  tasks: Task[];
};
