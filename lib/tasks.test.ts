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
