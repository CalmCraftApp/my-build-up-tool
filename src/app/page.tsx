"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTodayJST, formatDateJST } from "@/lib/date-utils";
import { LifeGoals } from "@/components/life-goals";
import { CHECKLIST_ITEMS, CHECKLIST_START_DATE } from "@/lib/checklist-items";

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

export default function HomePage() {
  const supabase = createClient();
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
    const [tasksRes, pointsRes, restRes, workRes, titlesRes, checklistRes] = await Promise.all([
      supabase
        .from("daily_tasks")
        .select("id, task_text, done")
        .eq("date_jst", selectedDate)
        .order("created_at", { ascending: true }),
      supabase
        .from("daily_tasks")
        .select("id", { count: "exact" })
        .eq("done", true),
      supabase
        .from("rest_days")
        .select("id")
        .eq("date_jst", selectedDate),
      supabase
        .from("work_hours")
        .select("work_hours_part, work_minutes_part, comment")
        .eq("date_jst", selectedDate)
        .single(),
      supabase
        .from("daily_titles")
        .select("id, title")
        .eq("date_jst", selectedDate)
        .order("created_at", { ascending: true }),
      supabase
        .from("daily_checklist")
        .select("item_key, checked")
        .eq("date_jst", selectedDate),
    ]);

    setTasks(tasksRes.data ?? []);
    setTotalPoints(pointsRes.count ?? 0);
    setTitles(titlesRes.data ?? []);
    setIsRest((restRes.data ?? []).length > 0);

    const checklistMap: Record<string, boolean> = {};
    for (const item of CHECKLIST_ITEMS) checklistMap[item.key] = false;
    for (const row of checklistRes.data ?? []) checklistMap[row.item_key] = row.checked;
    setChecklist(checklistMap);

    if (workRes.data) {
      const wh = workRes.data as WorkHoursRecord;
      setWorkHours(wh.work_hours_part?.toString() ?? "");
      setWorkMinutes(wh.work_minutes_part?.toString() ?? "");
      setComment(wh.comment ?? "");
    }

    setLoading(false);
  }, [supabase, selectedDate]);

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

    const { data } = await supabase
      .from("daily_tasks")
      .insert({
        date_jst: selectedDate,
        task_text: newTask.trim(),
      })
      .select("id, task_text, done")
      .single();

    if (data) {
      setTasks((prev) => [...prev, data]);
      setNewTask("");
    }
  }

  async function toggleTask(taskId: string, currentDone: boolean) {
    const newDone = !currentDone;
    const { error } = await supabase
      .from("daily_tasks")
      .update({
        done: newDone,
        checked_at: newDone ? new Date().toISOString() : null,
      })
      .eq("id", taskId);

    if (!error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, done: newDone } : t))
      );
      setTotalPoints((prev) => prev + (newDone ? 1 : -1));
    }
  }

  async function toggleChecklistItem(itemKey: string) {
    const newChecked = !checklist[itemKey];
    const { error } = await supabase.from("daily_checklist").upsert(
      {
        date_jst: selectedDate,
        item_key: itemKey,
        checked: newChecked,
        checked_at: newChecked ? new Date().toISOString() : null,
      },
      { onConflict: "date_jst,item_key" }
    );

    if (!error) {
      setChecklist((prev) => ({ ...prev, [itemKey]: newChecked }));
    }
  }

  async function deleteTask(taskId: string, wasDone: boolean) {
    const { error } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", taskId);

    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (wasDone) setTotalPoints((prev) => prev - 1);
    }
  }

  async function updateTask(taskId: string) {
    if (!editText.trim()) return;
    const { error } = await supabase
      .from("daily_tasks")
      .update({ task_text: editText.trim() })
      .eq("id", taskId);

    if (!error) {
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

    const { data } = await supabase
      .from("daily_titles")
      .insert({ date_jst: selectedDate, title: newTitle.trim() })
      .select("id, title")
      .single();

    if (data) {
      setTitles((prev) => [...prev, data]);
      setNewTitle("");
    }
  }

  async function deleteTitle(titleId: string) {
    const { error } = await supabase
      .from("daily_titles")
      .delete()
      .eq("id", titleId);

    if (!error) {
      setTitles((prev) => prev.filter((t) => t.id !== titleId));
    }
  }

  async function updateTitle(titleId: string) {
    if (!editTitleText.trim()) return;
    const { error } = await supabase
      .from("daily_titles")
      .update({ title: editTitleText.trim() })
      .eq("id", titleId);

    if (!error) {
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
      await supabase
        .from("rest_days")
        .delete()
        .eq("date_jst", selectedDate);
      setIsRest(false);
    } else {
      await supabase
        .from("rest_days")
        .insert({ date_jst: selectedDate });
      setIsRest(true);
    }
  }

  async function saveWorkHours(h: string, m: string) {
    const hoursVal = h === "" ? null : parseInt(h, 10);
    const minsVal = m === "" ? null : parseInt(m, 10);

    await supabase.from("work_hours").upsert(
      {
        date_jst: selectedDate,
        work_hours_part: hoursVal,
        work_minutes_part: minsVal,
        comment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "date_jst" }
    );
  }

  async function saveComment(newComment: string) {
    const hoursVal = workHours === "" ? null : parseInt(workHours, 10);
    const minsVal = workMinutes === "" ? null : parseInt(workMinutes, 10);

    await supabase.from("work_hours").upsert(
      {
        date_jst: selectedDate,
        work_hours_part: hoursVal,
        work_minutes_part: minsVal,
        comment: newComment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "date_jst" }
    );
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
            {CHECKLIST_ITEMS.map((item) => {
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
                      checked ? "text-green-500" : "text-gray-400"
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
