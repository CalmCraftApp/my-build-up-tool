"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTodayJST, formatDateJST } from "@/lib/date-utils";
import { LifeGoals } from "@/components/life-goals";

type Task = {
  id: string;
  task_text: string;
  done: boolean;
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
  const [isRest, setIsRest] = useState(false);
  const [workHours, setWorkHours] = useState("");
  const [workMinutes, setWorkMinutes] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [tasksRes, pointsRes, restRes, workRes] = await Promise.all([
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
    ]);

    setTasks(tasksRes.data ?? []);
    setTotalPoints(pointsRes.count ?? 0);
    setIsRest((restRes.data ?? []).length > 0);

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

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">{formatDateJST(selectedDate)} のタスク</h2>
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
        {tasks.length === 0 && (
          <p className="text-sm text-gray-400">タスクがまだありません</p>
        )}
        {tasks.map((task) => (
          <label
            key={task.id}
            className="flex items-center gap-3 rounded border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(task.id, task.done)}
              className="h-5 w-5 min-w-[20px] accent-green-600 cursor-pointer"
            />
            <span
              className={`text-sm ${task.done ? "line-through text-gray-400" : ""}`}
            >
              {task.task_text}
            </span>
          </label>
        ))}
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
