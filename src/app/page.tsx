"use client";

import { useEffect, useState, useCallback } from "react";
import { getTodayJST, formatDateJST } from "@/lib/date-utils";
import { LifeGoals } from "@/components/life-goals";
import {
  CHECKLIST_ITEMS,
  CHECKLIST_START_DATE,
  checklistItemsForDate,
} from "@/lib/checklist-items";

type Task = {
  id: string;
  task_text: string;
  done: boolean;
};

type Title = {
  id: string;
  title: string;
};

type WorkHoursRecord = {
  work_hours_part: number | null;
  work_minutes_part: number | null;
  comment: string | null;
};

type DayResponse = {
  tasks: Task[];
  totalPoints: number;
  isRest: boolean;
  workHours: WorkHoursRecord | null;
  titles: Title[];
  checklist: { item_key: string; checked: boolean }[];
};

export default function HomePage() {
  const today = getTodayJST();

  const [selectedDate, setSelectedDate] = useState(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [titles, setTitles] = useState<Title[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState("");
  const [isRest, setIsRest] = useState(false);
  const [workHours, setWorkHours] = useState("");
  const [workMinutes, setWorkMinutes] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/day?date=${selectedDate}`);
    const data: DayResponse = await res.json();

    setTasks(data.tasks ?? []);
    setTotalPoints(data.totalPoints ?? 0);
    setTitles(data.titles ?? []);
    setIsRest(data.isRest ?? false);

    const checklistMap: Record<string, boolean> = {};
    for (const item of CHECKLIST_ITEMS) checklistMap[item.key] = false;
    for (const row of data.checklist ?? []) checklistMap[row.item_key] = row.checked;
    setChecklist(checklistMap);

    if (data.workHours) {
      setWorkHours(data.workHours.work_hours_part?.toString() ?? "");
      setWorkMinutes(data.workHours.work_minutes_part?.toString() ?? "");
      setComment(data.workHours.comment ?? "");
    }

    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function changeDate(date: string) {
    setSelectedDate(date);
    setTasks([]);
    setTitles([]);
    setChecklist({});
    setIsRest(false);
    setWorkHours("");
    setWorkMinutes("");
    setComment("");
    setLoading(true);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date_jst: selectedDate, task_text: newTask.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => [...prev, data]);
      setNewTask("");
    }
  }

  async function toggleTask(taskId: string, currentDone: boolean) {
    const newDone = !currentDone;
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newDone }),
    });

    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, done: newDone } : t))
      );
      setTotalPoints((prev) => prev + (newDone ? 1 : -1));
    }
  }

  async function toggleChecklistItem(itemKey: string) {
    const newChecked = !checklist[itemKey];
    const res = await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_jst: selectedDate,
        item_key: itemKey,
        checked: newChecked,
      }),
    });

    if (res.ok) {
      setChecklist((prev) => ({ ...prev, [itemKey]: newChecked }));
    }
  }

  async function deleteTask(taskId: string, wasDone: boolean) {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });

    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (wasDone) setTotalPoints((prev) => prev - 1);
    }
  }

  async function updateTask(taskId: string) {
    if (!editText.trim()) return;
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_text: editText.trim() }),
    });

    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, task_text: editText.trim() } : t))
      );
      setEditingId(null);
      setEditText("");
    }
  }

  async function addTitle(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await fetch("/api/titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date_jst: selectedDate, title: newTitle.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setTitles((prev) => [...prev, data]);
      setNewTitle("");
    }
  }

  async function deleteTitle(titleId: string) {
    const res = await fetch(`/api/titles/${titleId}`, { method: "DELETE" });

    if (res.ok) {
      setTitles((prev) => prev.filter((t) => t.id !== titleId));
    }
  }

  async function updateTitle(titleId: string) {
    if (!editTitleText.trim()) return;
    const res = await fetch(`/api/titles/${titleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitleText.trim() }),
    });

    if (res.ok) {
      setTitles((prev) =>
        prev.map((t) =>
          t.id === titleId ? { ...t, title: editTitleText.trim() } : t
        )
      );
      setEditingTitleId(null);
      setEditTitleText("");
    }
  }

  async function toggleRest() {
    if (isRest) {
      await fetch(`/api/rest-days?date=${selectedDate}`, { method: "DELETE" });
      setIsRest(false);
    } else {
      await fetch("/api/rest-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_jst: selectedDate }),
      });
      setIsRest(true);
    }
  }

  async function saveWorkHours(h: string, m: string) {
    const hoursVal = h === "" ? null : parseInt(h, 10);
    const minsVal = m === "" ? null : parseInt(m, 10);

    await fetch("/api/work-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_jst: selectedDate,
        work_hours_part: hoursVal,
        work_minutes_part: minsVal,
        comment,
      }),
    });
  }

  async function saveComment(newComment: string) {
    const hoursVal = workHours === "" ? null : parseInt(workHours, 10);
    const minsVal = workMinutes === "" ? null : parseInt(workMinutes, 10);

    await fetch("/api/work-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_jst: selectedDate,
        work_hours_part: hoursVal,
        work_minutes_part: minsVal,
        comment: newComment,
      }),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <LifeGoals />

      <div className="text-center">
        <span className="text-3xl font-bold">累計 {totalPoints}pt</span>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">{formatDateJST(selectedDate)}</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => changeDate(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
        {selectedDate !== today && (
          <button
            onClick={() => changeDate(today)}
            className="text-xs text-blue-600 hover:underline"
          >
            今日に戻す
          </button>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">日のタイトル</h3>
        {titles.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded border border-gray-200 px-3 py-2 hover:bg-gray-50"
          >
            {editingTitleId === t.id ? (
              <form
                onSubmit={(e) => { e.preventDefault(); updateTitle(t.id); }}
                className="flex flex-1 gap-2"
              >
                <input
                  type="text"
                  value={editTitleText}
                  onChange={(e) => setEditTitleText(e.target.value)}
                  autoFocus
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button type="submit" className="text-xs text-blue-600 hover:underline">保存</button>
                <button type="button" onClick={() => setEditingTitleId(null)} className="text-xs text-gray-400 hover:underline">取消</button>
              </form>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{t.title}</span>
                <button
                  onClick={() => { setEditingTitleId(t.id); setEditTitleText(t.title); }}
                  className="text-xs text-gray-400 hover:text-blue-600"
                >
                  編集
                </button>
                <button
                  onClick={() => deleteTitle(t.id)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  削除
                </button>
              </>
            )}
          </div>
        ))}
        <form onSubmit={addTitle} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="今日やること..."
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 whitespace-nowrap"
          >
            追加
          </button>
        </form>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">タスク</h3>
        {tasks.length === 0 && (
          <p className="text-sm text-gray-400">タスクがまだありません</p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded border border-gray-200 px-3 py-2 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(task.id, task.done)}
              className="h-5 w-5 min-w-[20px] accent-green-600 cursor-pointer"
            />
            {editingId === task.id ? (
              <form
                onSubmit={(e) => { e.preventDefault(); updateTask(task.id); }}
                className="flex flex-1 gap-2"
              >
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button type="submit" className="text-xs text-blue-600 hover:underline">保存</button>
                <button type="button" onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">取消</button>
              </form>
            ) : (
              <>
                <span
                  className={`flex-1 text-sm ${task.done ? "line-through text-gray-400" : ""}`}
                >
                  {task.task_text}
                </span>
                <button
                  onClick={() => { setEditingId(task.id); setEditText(task.task_text); }}
                  className="text-xs text-gray-400 hover:text-blue-600"
                >
                  編集
                </button>
                <button
                  onClick={() => deleteTask(task.id, task.done)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  削除
                </button>
              </>
            )}
          </div>
        ))}
        <form onSubmit={addTask} className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
          >
            追加
          </button>
        </form>
      </div>

      <button
        onClick={toggleRest}
        className={`w-full rounded py-2 text-sm font-medium ${
          isRest
            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        {isRest ? "休みを解除する" : "今日は休みにする"}
      </button>

      {selectedDate >= CHECKLIST_START_DATE && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold">毎日チェックリスト</h3>
          <div className="rounded border border-gray-200 divide-y divide-gray-100">
            {checklistItemsForDate(selectedDate).map((item) => {
              const checked = checklist[item.key] ?? false;
              return (
                <div
                  key={item.key}
                  onClick={() => toggleChecklistItem(item.key)}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                    checked ? "bg-green-50 hover:bg-green-100" : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`text-2xl font-bold min-w-[20px] text-center ${
                      checked ? "text-green-500 md:text-4xl" : "text-gray-400"
                    }`}
                  >
                    {checked ? "○" : "✕"}
                  </span>
                  <span className="flex-1 text-sm">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded border border-gray-200 p-4">
        <h3 className="text-sm font-bold">作業時間</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="24"
            value={workHours}
            onChange={(e) => {
              setWorkHours(e.target.value);
              saveWorkHours(e.target.value, workMinutes);
            }}
            placeholder="0"
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none"
          />
          <span className="text-sm">時間</span>
          <input
            type="number"
            min="0"
            max="59"
            value={workMinutes}
            onChange={(e) => {
              setWorkMinutes(e.target.value);
              saveWorkHours(workHours, e.target.value);
            }}
            placeholder="0"
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none"
          />
          <span className="text-sm">分</span>
        </div>

        <h3 className="text-sm font-bold">一言コメント</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={(e) => saveComment(e.target.value)}
          placeholder="今日の振り返りなど..."
          rows={2}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}
