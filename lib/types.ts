/* lib/types.ts */
export type TaskStatus =
  | "inbox"
  | "later"
  | "discarded"
  | "today_now"
  | "today_next"
  | "done";

export type TaskPriority = "high" | "normal" | "low";

export type RecurrenceType = "daily" | "weekly" | "monthly";
export type Recurrence = {
  type: RecurrenceType;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
};

export type TaskContext = {
  pageUrl?: string;
  pageTitle?: string;
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  doneAt?: number;
  order: number; // 同一ステータス内の並び
  // Phase1 新フィールド
  description?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  startedAt?: number; // Nowに設定された時刻
  priority: TaskPriority; // デフォルト "normal"
  tags: string[]; // プロジェクトタグ
  recurrence?: Recurrence; // 定期タスク設定
  archivedAt?: number; // 論理削除
  laterDueDate?: number; // Later期限
  context?: TaskContext; // 作成時コンテキスト
  completedAtHour?: number; // 完了時の時間(0-23)
  dayOfWeek?: number; // 完了時の曜日(0-6)
};

export type PersistedStateV1 = {
  version: 1;
  updatedAt: number;
  tasks: Task[];
};

export type AppSettings = {
  pomodoroMinutes: number; // デフォルト25
  dailyGoal: number; // デフォルト0(自動算出)
  enableAI: boolean; // AIタスク分解
};

export type PersistedStateV2 = {
  version: 2;
  updatedAt: number;
  tasks: Task[];
  settings: AppSettings;
};
