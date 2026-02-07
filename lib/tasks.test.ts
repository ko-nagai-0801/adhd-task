/* lib/tasks.test.ts */
import { describe, it, expect } from "vitest";
import { tasksReducer, initialTasksState, type TasksState } from "./tasks";
import type { Task } from "./types";

function mkTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "テスト",
    status: "inbox",
    createdAt: 1000,
    updatedAt: 1000,
    order: 1,
    priority: "normal",
    tags: [],
    ...overrides,
  };
}

function stateWith(tasks: Task[]): TasksState {
  return { hydrated: true, tasks };
}

/* ── ADD_TASK ── */
describe("ADD_TASK", () => {
  it("inboxに新タスクを追加する", () => {
    const s = tasksReducer(initialTasksState, {
      type: "ADD_TASK",
      id: "new1",
      title: "やること",
      now: 2000,
    });
    expect(s.tasks).toHaveLength(1);
    expect(s.tasks[0]!.status).toBe("inbox");
    expect(s.tasks[0]!.title).toBe("やること");
  });

  it("空タイトルは無視する", () => {
    const s = tasksReducer(initialTasksState, {
      type: "ADD_TASK",
      id: "new1",
      title: "   ",
      now: 2000,
    });
    expect(s.tasks).toHaveLength(0);
  });

  it("orderがインクリメントされる", () => {
    const base = stateWith([mkTask({ id: "t1", order: 3 })]);
    const s = tasksReducer(base, {
      type: "ADD_TASK",
      id: "new1",
      title: "二つ目",
      now: 2000,
    });
    expect(s.tasks.find((t) => t.id === "new1")!.order).toBe(4);
  });

  it("新タスクにはデフォルトのpriority/tagsが設定される", () => {
    const s = tasksReducer(initialTasksState, {
      type: "ADD_TASK",
      id: "new1",
      title: "タスク",
      now: 2000,
    });
    expect(s.tasks[0]!.priority).toBe("normal");
    expect(s.tasks[0]!.tags).toEqual([]);
  });
});

/* ── MOVE ── */
describe("MOVE", () => {
  it("inboxからtoday_nextに移動する（唯一のnextなら自動昇格でnowになる）", () => {
    const base = stateWith([mkTask({ id: "t1", status: "inbox" })]);
    const s = tasksReducer(base, { type: "MOVE", id: "t1", to: "today_next", now: 2000 });
    // nowが空なのでpromoteNextToNowIfEmptyで自動昇格される
    expect(s.tasks[0]!.status).toBe("today_now");
  });

  it("既にnowがある場合はtoday_nextのまま", () => {
    const base = stateWith([
      mkTask({ id: "t1", status: "inbox" }),
      mkTask({ id: "t2", status: "today_now", order: 0 }),
    ]);
    const s = tasksReducer(base, { type: "MOVE", id: "t1", to: "today_next", now: 2000 });
    expect(s.tasks.find((t) => t.id === "t1")!.status).toBe("today_next");
  });

  it("doneに移動するとdoneAtが設定される", () => {
    const base = stateWith([mkTask({ id: "t1", status: "today_now" })]);
    const s = tasksReducer(base, { type: "MOVE", id: "t1", to: "done", now: 5000 });
    expect(s.tasks[0]!.status).toBe("done");
    expect(s.tasks[0]!.doneAt).toBe(5000);
  });

  it("today_nowに移動するとorder=0になる", () => {
    const base = stateWith([mkTask({ id: "t1", status: "inbox", order: 5 })]);
    const s = tasksReducer(base, { type: "MOVE", id: "t1", to: "today_now", now: 2000 });
    expect(s.tasks.find((t) => t.id === "t1")!.order).toBe(0);
  });

  it("today_nowに移動するとstartedAtが設定される", () => {
    const base = stateWith([mkTask({ id: "t1", status: "inbox" })]);
    const s = tasksReducer(base, { type: "MOVE", id: "t1", to: "today_now", now: 3000 });
    expect(s.tasks.find((t) => t.id === "t1")!.startedAt).toBe(3000);
  });

  it("doneに移動するとcompletedAtHourとdayOfWeekが設定される", () => {
    const base = stateWith([mkTask({ id: "t1", status: "today_now", startedAt: 1000 })]);
    const now = 5000;
    const s = tasksReducer(base, { type: "MOVE", id: "t1", to: "done", now });
    const task = s.tasks[0]!;
    const d = new Date(now);
    expect(task.completedAtHour).toBe(d.getHours());
    expect(task.dayOfWeek).toBe(d.getDay());
  });

  it("doneに移動するとstartedAtからactualMinutesが算出される", () => {
    const startedAt = 1000;
    const now = 1000 + 30 * 60000; // 30分後
    const base = stateWith([mkTask({ id: "t1", status: "today_now", startedAt })]);
    const s = tasksReducer(base, { type: "MOVE", id: "t1", to: "done", now });
    expect(s.tasks[0]!.actualMinutes).toBe(30);
  });

  it("定期タスクをdoneに移動すると次回タスクが生成される", () => {
    const base = stateWith([
      mkTask({
        id: "t1",
        status: "today_now",
        recurrence: { type: "daily" },
      }),
    ]);
    const s = tasksReducer(base, { type: "MOVE", id: "t1", to: "done", now: 5000 });
    expect(s.tasks).toHaveLength(2);
    const recurring = s.tasks.find((t) => t.id !== "t1");
    expect(recurring).toBeDefined();
    expect(recurring!.status).toBe("inbox");
    expect(recurring!.recurrence).toEqual({ type: "daily" });
    expect(recurring!.title).toBe("テスト");
  });
});

/* ── SET_NOW ── */
describe("SET_NOW", () => {
  it("指定タスクをtoday_nowにし、既存nowをtoday_nextに戻す", () => {
    const base = stateWith([
      mkTask({ id: "t1", status: "today_now", order: 0 }),
      mkTask({ id: "t2", status: "today_next", order: 1 }),
    ]);
    const s = tasksReducer(base, { type: "SET_NOW", id: "t2", now: 3000 });
    expect(s.tasks.find((t) => t.id === "t2")!.status).toBe("today_now");
    expect(s.tasks.find((t) => t.id === "t1")!.status).toBe("today_next");
  });

  it("存在しないidでは何も変わらない", () => {
    const base = stateWith([mkTask({ id: "t1", status: "today_now" })]);
    const s = tasksReducer(base, { type: "SET_NOW", id: "nonexist", now: 3000 });
    expect(s).toBe(base);
  });

  it("SET_NOWでstartedAtが設定される", () => {
    const base = stateWith([
      mkTask({ id: "t1", status: "today_now", order: 0 }),
      mkTask({ id: "t2", status: "today_next", order: 1 }),
    ]);
    const s = tasksReducer(base, { type: "SET_NOW", id: "t2", now: 3000 });
    expect(s.tasks.find((t) => t.id === "t2")!.startedAt).toBe(3000);
  });
});

/* ── COMPLETE_NOW ── */
describe("COMPLETE_NOW", () => {
  it("today_nowタスクをdoneにする", () => {
    const base = stateWith([mkTask({ id: "t1", status: "today_now" })]);
    const s = tasksReducer(base, { type: "COMPLETE_NOW", now: 4000 });
    expect(s.tasks[0]!.status).toBe("done");
    expect(s.tasks[0]!.doneAt).toBe(4000);
  });

  it("nowがない場合は何も変わらない", () => {
    const base = stateWith([mkTask({ id: "t1", status: "inbox" })]);
    const s = tasksReducer(base, { type: "COMPLETE_NOW", now: 4000 });
    expect(s).toBe(base);
  });

  it("完了後にnextが自動昇格する", () => {
    const base = stateWith([
      mkTask({ id: "t1", status: "today_now", order: 0 }),
      mkTask({ id: "t2", status: "today_next", order: 1 }),
      mkTask({ id: "t3", status: "today_next", order: 2 }),
    ]);
    const s = tasksReducer(base, { type: "COMPLETE_NOW", now: 5000 });
    expect(s.tasks.find((t) => t.id === "t1")!.status).toBe("done");
    expect(s.tasks.find((t) => t.id === "t2")!.status).toBe("today_now");
    expect(s.tasks.find((t) => t.id === "t3")!.status).toBe("today_next");
  });

  it("completedAtHourとdayOfWeekが設定される", () => {
    const now = 4000;
    const base = stateWith([mkTask({ id: "t1", status: "today_now", startedAt: 1000 })]);
    const s = tasksReducer(base, { type: "COMPLETE_NOW", now });
    const d = new Date(now);
    expect(s.tasks[0]!.completedAtHour).toBe(d.getHours());
    expect(s.tasks[0]!.dayOfWeek).toBe(d.getDay());
  });

  it("startedAtからactualMinutesが算出される", () => {
    const startedAt = 1000;
    const now = 1000 + 15 * 60000; // 15分後
    const base = stateWith([mkTask({ id: "t1", status: "today_now", startedAt })]);
    const s = tasksReducer(base, { type: "COMPLETE_NOW", now });
    expect(s.tasks[0]!.actualMinutes).toBe(15);
  });

  it("定期タスク完了時に次回タスクが生成される", () => {
    const base = stateWith([
      mkTask({
        id: "t1",
        status: "today_now",
        recurrence: { type: "weekly", dayOfWeek: 1 },
      }),
    ]);
    const s = tasksReducer(base, { type: "COMPLETE_NOW", now: 5000 });
    expect(s.tasks.filter((t) => t.status !== "done")).toHaveLength(1);
    const newTask = s.tasks.find((t) => t.id !== "t1")!;
    expect(newTask.status).toBe("inbox");
    expect(newTask.recurrence).toEqual({ type: "weekly", dayOfWeek: 1 });
  });
});

/* ── REORDER_TODAY_NEXT ── */
describe("REORDER_TODAY_NEXT", () => {
  it("upで前のタスクとorderを入れ替える", () => {
    const base = stateWith([
      mkTask({ id: "t1", status: "today_next", order: 1 }),
      mkTask({ id: "t2", status: "today_next", order: 2 }),
    ]);
    const s = tasksReducer(base, { type: "REORDER_TODAY_NEXT", id: "t2", dir: "up", now: 3000 });
    expect(s.tasks.find((t) => t.id === "t2")!.order).toBe(1);
    expect(s.tasks.find((t) => t.id === "t1")!.order).toBe(2);
  });

  it("先頭でupしても何も変わらない", () => {
    const base = stateWith([
      mkTask({ id: "t1", status: "today_next", order: 1 }),
      mkTask({ id: "t2", status: "today_next", order: 2 }),
    ]);
    const s = tasksReducer(base, { type: "REORDER_TODAY_NEXT", id: "t1", dir: "up", now: 3000 });
    expect(s).toBe(base);
  });

  it("末尾でdownしても何も変わらない", () => {
    const base = stateWith([
      mkTask({ id: "t1", status: "today_next", order: 1 }),
      mkTask({ id: "t2", status: "today_next", order: 2 }),
    ]);
    const s = tasksReducer(base, { type: "REORDER_TODAY_NEXT", id: "t2", dir: "down", now: 3000 });
    expect(s).toBe(base);
  });
});

/* ── ensureSingleNow ── */
describe("ensureSingleNow (via HYDRATE)", () => {
  it("複数nowがある場合、最後にupdatedされたものだけ残す", () => {
    const tasks: Task[] = [
      mkTask({ id: "t1", status: "today_now", updatedAt: 1000 }),
      mkTask({ id: "t2", status: "today_now", updatedAt: 2000 }),
    ];
    const s = tasksReducer(initialTasksState, { type: "HYDRATE", tasks });
    const nowTasks = s.tasks.filter((t) => t.status === "today_now");
    expect(nowTasks).toHaveLength(1);
    expect(nowTasks[0]!.id).toBe("t2");
    expect(s.tasks.find((t) => t.id === "t1")!.status).toBe("today_next");
  });

  it("nowが1つなら何もしない", () => {
    const tasks: Task[] = [mkTask({ id: "t1", status: "today_now" })];
    const s = tasksReducer(initialTasksState, { type: "HYDRATE", tasks });
    expect(s.tasks.filter((t) => t.status === "today_now")).toHaveLength(1);
  });
});

/* ── promoteNextToNowIfEmpty ── */
describe("promoteNextToNowIfEmpty (via HYDRATE)", () => {
  it("nowがなくnextがある場合、order最小のnextを自動昇格する", () => {
    const tasks: Task[] = [
      mkTask({ id: "t1", status: "today_next", order: 3 }),
      mkTask({ id: "t2", status: "today_next", order: 1 }),
    ];
    const s = tasksReducer(initialTasksState, { type: "HYDRATE", tasks });
    expect(s.tasks.find((t) => t.id === "t2")!.status).toBe("today_now");
    expect(s.tasks.find((t) => t.id === "t1")!.status).toBe("today_next");
  });

  it("nextもnowもない場合は何も変わらない", () => {
    const tasks: Task[] = [mkTask({ id: "t1", status: "inbox" })];
    const s = tasksReducer(initialTasksState, { type: "HYDRATE", tasks });
    expect(s.tasks[0]!.status).toBe("inbox");
  });
});

/* ── IMPORT_TASKS ── */
describe("IMPORT_TASKS", () => {
  it("タスクを上書きする", () => {
    const base = stateWith([mkTask({ id: "old", title: "旧" })]);
    const imported: Task[] = [
      mkTask({ id: "new1", title: "新A" }),
      mkTask({ id: "new2", title: "新B" }),
    ];
    const s = tasksReducer(base, { type: "IMPORT_TASKS", tasks: imported });
    expect(s.tasks).toHaveLength(2);
    expect(s.tasks.map((t) => t.id).sort()).toEqual(["new1", "new2"]);
  });

  it("インポート後もensureSingleNow/promoteが適用される", () => {
    const base = stateWith([]);
    const imported: Task[] = [
      mkTask({ id: "t1", status: "today_now", updatedAt: 100 }),
      mkTask({ id: "t2", status: "today_now", updatedAt: 200 }),
    ];
    const s = tasksReducer(base, { type: "IMPORT_TASKS", tasks: imported });
    expect(s.tasks.filter((t) => t.status === "today_now")).toHaveLength(1);
  });
});

/* ── RESTORE_FROM_DISCARDED ── */
describe("RESTORE_FROM_DISCARDED", () => {
  it("discardedからinboxに戻す", () => {
    const base = stateWith([mkTask({ id: "t1", status: "discarded" })]);
    const s = tasksReducer(base, { type: "RESTORE_FROM_DISCARDED", id: "t1", now: 6000 });
    expect(s.tasks[0]!.status).toBe("inbox");
  });
});

/* ── UNDO_DONE_TO_INBOX ── */
describe("UNDO_DONE_TO_INBOX", () => {
  it("doneからinboxに戻し、doneAtをクリアする", () => {
    const base = stateWith([mkTask({ id: "t1", status: "done", doneAt: 3000 })]);
    const s = tasksReducer(base, { type: "UNDO_DONE_TO_INBOX", id: "t1", now: 7000 });
    expect(s.tasks[0]!.status).toBe("inbox");
    expect(s.tasks[0]!.doneAt).toBeUndefined();
  });
});

/* ── SET_DESCRIPTION ── */
describe("SET_DESCRIPTION", () => {
  it("タスクに説明を設定する", () => {
    const base = stateWith([mkTask({ id: "t1" })]);
    const s = tasksReducer(base, { type: "SET_DESCRIPTION", id: "t1", description: "詳細メモ", now: 3000 });
    expect(s.tasks[0]!.description).toBe("詳細メモ");
    expect(s.tasks[0]!.updatedAt).toBe(3000);
  });
});

/* ── SET_PRIORITY ── */
describe("SET_PRIORITY", () => {
  it("優先度を変更する", () => {
    const base = stateWith([mkTask({ id: "t1" })]);
    const s = tasksReducer(base, { type: "SET_PRIORITY", id: "t1", priority: "high", now: 3000 });
    expect(s.tasks[0]!.priority).toBe("high");
  });

  it("lowに変更できる", () => {
    const base = stateWith([mkTask({ id: "t1", priority: "high" })]);
    const s = tasksReducer(base, { type: "SET_PRIORITY", id: "t1", priority: "low", now: 3000 });
    expect(s.tasks[0]!.priority).toBe("low");
  });
});

/* ── ADD_TAG / REMOVE_TAG ── */
describe("ADD_TAG / REMOVE_TAG", () => {
  it("タグを追加する", () => {
    const base = stateWith([mkTask({ id: "t1" })]);
    const s = tasksReducer(base, { type: "ADD_TAG", id: "t1", tag: "仕事", now: 3000 });
    expect(s.tasks[0]!.tags).toEqual(["仕事"]);
  });

  it("重複タグは追加されない", () => {
    const base = stateWith([mkTask({ id: "t1", tags: ["仕事"] })]);
    const s = tasksReducer(base, { type: "ADD_TAG", id: "t1", tag: "仕事", now: 3000 });
    expect(s.tasks[0]!.tags).toEqual(["仕事"]);
  });

  it("タグを削除する", () => {
    const base = stateWith([mkTask({ id: "t1", tags: ["仕事", "個人"] })]);
    const s = tasksReducer(base, { type: "REMOVE_TAG", id: "t1", tag: "仕事", now: 3000 });
    expect(s.tasks[0]!.tags).toEqual(["個人"]);
  });
});

/* ── SET_ESTIMATE ── */
describe("SET_ESTIMATE", () => {
  it("見積時間を設定する", () => {
    const base = stateWith([mkTask({ id: "t1" })]);
    const s = tasksReducer(base, { type: "SET_ESTIMATE", id: "t1", minutes: 25, now: 3000 });
    expect(s.tasks[0]!.estimatedMinutes).toBe(25);
  });
});

/* ── ARCHIVE_TASK / RESTORE_ARCHIVED ── */
describe("ARCHIVE_TASK / RESTORE_ARCHIVED", () => {
  it("タスクをアーカイブする（archivedAtが設定される）", () => {
    const base = stateWith([mkTask({ id: "t1" })]);
    const s = tasksReducer(base, { type: "ARCHIVE_TASK", id: "t1", now: 3000 });
    expect(s.tasks[0]!.archivedAt).toBe(3000);
  });

  it("アーカイブから復元する（archivedAtがクリアされる）", () => {
    const base = stateWith([mkTask({ id: "t1", archivedAt: 2000 })]);
    const s = tasksReducer(base, { type: "RESTORE_ARCHIVED", id: "t1", now: 3000 });
    expect(s.tasks[0]!.archivedAt).toBeUndefined();
    expect(s.tasks[0]!.updatedAt).toBe(3000);
  });
});

/* ── SET_LATER_DUE ── */
describe("SET_LATER_DUE", () => {
  it("Later期限を設定する", () => {
    const base = stateWith([mkTask({ id: "t1", status: "later" })]);
    const dueDate = Date.now() + 86400000;
    const s = tasksReducer(base, { type: "SET_LATER_DUE", id: "t1", date: dueDate, now: 3000 });
    expect(s.tasks[0]!.laterDueDate).toBe(dueDate);
  });
});

/* ── SET_RECURRENCE ── */
describe("SET_RECURRENCE", () => {
  it("定期タスク設定を付与する", () => {
    const base = stateWith([mkTask({ id: "t1" })]);
    const s = tasksReducer(base, {
      type: "SET_RECURRENCE",
      id: "t1",
      recurrence: { type: "weekly", dayOfWeek: 1 },
      now: 3000,
    });
    expect(s.tasks[0]!.recurrence).toEqual({ type: "weekly", dayOfWeek: 1 });
  });

  it("定期タスク設定を解除する", () => {
    const base = stateWith([mkTask({ id: "t1", recurrence: { type: "daily" } })]);
    const s = tasksReducer(base, {
      type: "SET_RECURRENCE",
      id: "t1",
      recurrence: undefined,
      now: 3000,
    });
    expect(s.tasks[0]!.recurrence).toBeUndefined();
  });
});

/* ── HYDRATE ensures defaults ── */
describe("HYDRATE defaults", () => {
  it("priority/tagsがないタスクにデフォルト値を付与する", () => {
    // v1から来たタスク（priority/tagsなし）をシミュレート
    const legacyTask = {
      id: "t1",
      title: "古いタスク",
      status: "inbox" as const,
      createdAt: 1000,
      updatedAt: 1000,
      order: 1,
    } as Task;
    const s = tasksReducer(initialTasksState, { type: "HYDRATE", tasks: [legacyTask] });
    expect(s.tasks[0]!.priority).toBe("normal");
    expect(s.tasks[0]!.tags).toEqual([]);
  });
});
